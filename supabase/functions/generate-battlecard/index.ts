import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function tryParseJSON(text: string): any {
  try { return JSON.parse(text); } catch {}
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) { try { return JSON.parse(codeBlock[1].trim()); } catch {} }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) { try { return JSON.parse(text.slice(first, last + 1)); } catch {} }
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
    const { competitor_id, user_id } = await req.json();
    if (!competitor_id || !user_id) {
      return new Response(JSON.stringify({ success: false, error: "competitor_id and user_id are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 1 — Gather data
    const [reportRes, compRes, profileRes] = await Promise.all([
      supabase.from("analysis_reports").select("*").eq("competitor_id", competitor_id)
        .order("created_at", { ascending: false }).limit(1).single(),
      supabase.from("competitors").select("name, industry, description, website_url").eq("id", competitor_id).single(),
      supabase.from("profiles").select("company_name, industry").eq("id", user_id).single(),
    ]);

    if (compRes.error || !compRes.data) throw new Error("Competitor not found");
    if (reportRes.error || !reportRes.data) {
      return new Response(JSON.stringify({ success: false, error: "No analysis report found. Run an analysis first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const competitor = compRes.data;
    const profile = profileRes.data || { company_name: "Unknown", industry: "Unknown" };
    const report = reportRes.data;
    const companyName = profile.company_name || "our company";
    const industry = profile.industry || competitor.industry || "technology";

    // STEP 2 — AI call
    const systemPrompt = `You are a competitive sales strategist. Based on this competitive intelligence data, generate a sales battlecard — a one-page cheat sheet that a salesperson can reference during a call or meeting. The user's company is ${companyName} in the ${industry} industry. The competitor is ${competitor.name}.

Return ONLY valid JSON with these exact keys:

- overview (string, 2-3 sentence summary of who this competitor is and their market position)
- their_strengths (array of strings, 3-6 bullet points of what they genuinely do well)
- their_weaknesses (array of strings, 3-6 bullet points of where they fall short)
- counter_positioning (array of objects with 'objection' string and 'response' string — 4-6 common objections a prospect might raise about choosing your company over this competitor, with suggested responses)
- pricing_comparison (object with 'summary' string describing their pricing approach, 'their_price_range' string if known, 'positioning_tip' string for how to handle pricing conversations)
- talk_tracks (array of strings, 3-5 conversation starters or pivots to use when this competitor comes up in a sales conversation)
- key_differentiators (array of strings, 3-5 clear reasons why the user's company is different/better)
- win_themes (array of strings, 2-3 themes that consistently win against this competitor)

Be specific and actionable. No generic advice. Base everything on the actual intelligence data provided. Return ONLY valid JSON, no markdown.`;

    const userContent = `Competitor: ${competitor.name}\nWebsite: ${competitor.website_url}\nIndustry: ${competitor.industry || "Unknown"}\nDescription: ${competitor.description || "N/A"}\n\nAnalysis Report (${report.report_type}):\n${JSON.stringify(report.full_report, null, 2)}`;

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
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

    // STEP 3 — Upsert battlecard
    // Check for existing battlecard
    const { data: existing } = await supabase.from("battlecards")
      .select("id").eq("competitor_id", competitor_id).eq("user_id", user_id).limit(1).single();

    const battlecardData = {
      user_id,
      competitor_id,
      title: `Battlecard: ${competitor.name}`,
      overview: parsed.overview || "",
      their_strengths: parsed.their_strengths || [],
      their_weaknesses: parsed.their_weaknesses || [],
      counter_positioning: parsed.counter_positioning || [],
      pricing_comparison: parsed.pricing_comparison || null,
      talk_tracks: parsed.talk_tracks || [],
      key_differentiators: parsed.key_differentiators || [],
      last_updated_from_report_id: report.id,
      updated_at: new Date().toISOString(),
    };

    let battlecardId: string;
    if (existing?.id) {
      const { error } = await supabase.from("battlecards").update(battlecardData).eq("id", existing.id);
      if (error) throw new Error(`Failed to update battlecard: ${error.message}`);
      battlecardId = existing.id;
    } else {
      const { data, error } = await supabase.from("battlecards").insert(battlecardData).select("id").single();
      if (error) throw new Error(`Failed to insert battlecard: ${error.message}`);
      battlecardId = data.id;
    }

    return new Response(JSON.stringify({ success: true, battlecard_id: battlecardId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Battlecard error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
