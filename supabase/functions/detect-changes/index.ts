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
    const { competitor_id, user_id, new_scrape_job_id } = await req.json();
    if (!competitor_id || !user_id || !new_scrape_job_id) {
      return new Response(JSON.stringify({ success: false, error: "competitor_id, user_id, and new_scrape_job_id are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 1 — Pull two most recent snapshots
    const { data: snapshots, error: snapErr } = await supabase
      .from("competitor_snapshots")
      .select("*")
      .eq("competitor_id", competitor_id)
      .order("captured_at", { ascending: false })
      .limit(2);

    if (snapErr) throw new Error(`Failed to fetch snapshots: ${snapErr.message}`);
    if (!snapshots || snapshots.length < 2) {
      return new Response(JSON.stringify({ success: true, message: "First snapshot — no comparison possible.", alerts_created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [current, previous] = snapshots;

    // STEP 2 — Compare hashes
    if (current.content_hash === previous.content_hash) {
      return new Response(JSON.stringify({ success: true, message: "No changes detected.", alerts_created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 3 — Pull scrape results for both jobs
    const currentJobId = (current.snapshot_data as any)?.report_id ? null : new_scrape_job_id;
    const previousJobId = (previous.snapshot_data as any)?.report_id ? null : null;

    // Get current and previous scrape results by time proximity to snapshots
    const [newRes, oldRes] = await Promise.all([
      supabase.from("scrape_results").select("page_url, page_type, raw_content")
        .eq("competitor_id", competitor_id).eq("scrape_job_id", new_scrape_job_id).limit(30),
      supabase.from("scrape_results").select("page_url, page_type, raw_content")
        .eq("competitor_id", competitor_id).neq("scrape_job_id", new_scrape_job_id)
        .order("scraped_at", { ascending: false }).limit(30),
    ]);

    const newPages = newRes.data || [];
    const oldPages = oldRes.data || [];

    // Group by page_type
    const group = (pages: any[]) => {
      const g: Record<string, string[]> = {};
      for (const p of pages) {
        const t = p.page_type || "other";
        if (!g[t]) g[t] = [];
        g[t].push(`[${p.page_url}]\n${(p.raw_content || "").slice(0, 3000)}`);
      }
      return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.join("\n---\n")]));
    };

    const oldGrouped = group(oldPages);
    const newGrouped = group(newPages);

    // STEP 4 — AI comparison
    const systemPrompt = `You are a competitive intelligence analyst. Compare these two snapshots of a competitor's website taken at different times. Identify what changed and why it matters.

Previous snapshot:
${JSON.stringify(oldGrouped, null, 2).slice(0, 15000)}

Current snapshot:
${JSON.stringify(newGrouped, null, 2).slice(0, 15000)}

Return ONLY valid JSON with these keys:
- changes (array of objects, each with:
  - alert_type (string, one of: pricing_change, new_content, messaging_shift, new_feature, review_change)
  - title (string, short descriptive title of what changed)
  - description (string, 2-3 sentences explaining what changed and why it matters strategically)
  - old_value (string or null, what it was before)
  - new_value (string, what it is now)
  - significance (string: high, medium, low)
)

Only include genuinely meaningful changes, not trivial text edits. Focus on pricing, features, messaging, positioning, and strategic shifts. Return ONLY valid JSON, no markdown.`;

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze the differences between these two snapshots and return the changes." },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add funds to your workspace.");
    if (!res.ok) throw new Error(`AI gateway error [${res.status}]: ${await res.text()}`);

    const aiData = await res.json();
    const raw = aiData.choices?.[0]?.message?.content || "";
    const parsed = tryParseJSON(raw);

    if (!parsed || !Array.isArray(parsed.changes)) {
      return new Response(JSON.stringify({ success: true, message: "Changes detected but AI could not categorize them.", alerts_created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 5 — Create alerts
    const validTypes = ["pricing_change", "new_content", "messaging_shift", "new_feature", "review_change"];
    const alertRows = parsed.changes
      .filter((c: any) => c.title && c.description)
      .map((c: any) => ({
        user_id,
        competitor_id,
        alert_type: validTypes.includes(c.alert_type) ? c.alert_type : "new_content",
        title: c.title,
        description: c.description,
        old_value: c.old_value ? { value: c.old_value } : null,
        new_value: c.new_value ? { value: c.new_value } : null,
        is_read: false,
      }));

    if (alertRows.length > 0) {
      const { error: alertErr } = await supabase.from("alerts").insert(alertRows);
      if (alertErr) console.error("Failed to insert alerts:", alertErr);
    }

    return new Response(JSON.stringify({ success: true, alerts_created: alertRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Detect changes error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
