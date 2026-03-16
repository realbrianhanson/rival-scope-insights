import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function tryParseJSON(text: string): any {
  try { return JSON.parse(text); } catch {}
  const cb = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cb) { try { return JSON.parse(cb[1].trim()); } catch {} }
  const f = text.indexOf("{"), l = text.lastIndexOf("}");
  if (f !== -1 && l > f) { try { return JSON.parse(text.slice(f, l + 1)); } catch {} }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { competitor_ids, user_id, title: userTitle } = await req.json();
    if (!competitor_ids || !Array.isArray(competitor_ids) || competitor_ids.length < 2 || competitor_ids.length > 5 || !user_id) {
      return new Response(JSON.stringify({ success: false, error: "competitor_ids (array of 2-5 uuids) and user_id are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 1 — Gather data
    const [profileRes, ...compResults] = await Promise.all([
      supabase.from("profiles").select("company_name, industry").eq("id", user_id).single(),
      ...competitor_ids.map((id: string) => Promise.all([
        supabase.from("competitors").select("name, industry, description, website_url").eq("id", id).single(),
        supabase.from("analysis_reports").select("full_report, report_type").eq("competitor_id", id)
          .order("created_at", { ascending: false }).limit(1).single(),
      ])),
    ]);

    const profile = profileRes.data || { company_name: "Unknown", industry: "Unknown" };
    const companyName = profile.company_name || "our company";
    const industry = profile.industry || "technology";

    const competitorData = compResults.map(([compRes, reportRes]: any) => ({
      name: compRes.data?.name || "Unknown",
      industry: compRes.data?.industry,
      description: compRes.data?.description,
      website_url: compRes.data?.website_url,
      report: reportRes.data?.full_report || null,
    }));

    const competitorNames = competitorData.map((c: any) => c.name);

    // STEP 2 — AI call
    const systemPrompt = `You are a competitive analyst. Create a detailed feature and positioning comparison matrix. The user's company is ${companyName} in the ${industry} industry.

Competitors being compared: ${competitorNames.join(", ")}

Based on the intelligence data for each competitor, create a comparison matrix. Return ONLY valid JSON with:

- title (string, descriptive title for this comparison)
- categories (array of objects, each with:
  - name (string, category name like 'Pricing', 'Features', 'Support', 'Content/Marketing', 'Target Audience', 'Technology')
  - features (array of objects, each with:
    - name (string, specific feature or attribute being compared)
    - values (object where keys are competitor names and values are objects with 'status' string one of: 'yes', 'no', 'partial', 'unknown' and 'detail' string with brief explanation)
  )
)
- summary (string, 2-3 sentence executive summary of how these competitors compare)
- your_advantages (array of strings, key areas where ${companyName} could differentiate)

Be thorough but focused. Include 4-6 categories with 3-5 features each. Base everything on actual data from the intelligence reports. Return ONLY valid JSON, no markdown.`;

    const userContent = competitorData.map((c: any) =>
      `--- ${c.name} ---\nWebsite: ${c.website_url}\nIndustry: ${c.industry || "Unknown"}\nDescription: ${c.description || "N/A"}\nIntelligence Report:\n${c.report ? JSON.stringify(c.report, null, 2).slice(0, 8000) : "No report available"}`
    ).join("\n\n");

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add funds to your workspace.");
    if (!res.ok) throw new Error(`AI gateway error [${res.status}]: ${await res.text()}`);

    const aiData = await res.json();
    const raw = aiData.choices?.[0]?.message?.content || "";
    const parsed = tryParseJSON(raw);

    if (!parsed) throw new Error("Failed to parse AI response into valid JSON");

    // STEP 3 — Insert comparison matrix
    const { data: matrix, error: matErr } = await supabase.from("comparison_matrices").insert({
      user_id,
      title: userTitle || parsed.title || `Comparison: ${competitorNames.join(" vs ")}`,
      description: parsed.summary || null,
      competitor_ids,
      categories: parsed.categories || [],
      matrix_data: {
        your_advantages: parsed.your_advantages || [],
        summary: parsed.summary || "",
        generated_at: new Date().toISOString(),
      },
    }).select("id").single();

    if (matErr) throw new Error(`Failed to insert comparison matrix: ${matErr.message}`);

    return new Response(JSON.stringify({ success: true, matrix_id: matrix.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Comparison error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
