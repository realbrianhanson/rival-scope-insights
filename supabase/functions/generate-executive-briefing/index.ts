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
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1].trim()); } catch {}
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
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
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ success: false, error: "user_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 1 — Gather comprehensive data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [profileRes, competitorsRes, reportsRes, alertsRes, gapsRes] = await Promise.all([
      supabase.from("profiles").select("company_name, industry").eq("id", user_id).single(),
      supabase.from("competitors").select("id, name, threat_score, threat_level, status").eq("status", "active"),
      supabase.from("analysis_reports").select("id, title, summary, report_type, created_at, competitor_id, competitors(name)")
        .gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }),
      supabase.from("alerts").select("id, title, description, alert_type, created_at, competitor_id, competitors(name)")
        .gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }),
      supabase.from("market_gaps").select("id, gap_title, gap_category, gap_description, opportunity_score, competitor_id, competitors(name)")
        .order("opportunity_score", { ascending: false }).limit(10),
    ]);

    const profile = profileRes.data || { company_name: "Unknown", industry: "Unknown" };
    const competitors = competitorsRes.data || [];
    const reports = reportsRes.data || [];
    const alerts = alertsRes.data || [];
    const gaps = gapsRes.data || [];

    const companyName = profile.company_name || "our company";
    const industry = profile.industry || "technology";

    // Build context strings
    const competitorsList = competitors.map((c: any) =>
      `- ${c.name}: Threat Score ${c.threat_score ?? 'N/A'}/100 (${c.threat_level || 'unscored'})`
    ).join("\n") || "No active competitors tracked.";

    const reportsList = reports.map((r: any) =>
      `- [${r.report_type}] ${r.title} (${(r.competitors as any)?.name || 'multi'}): ${r.summary?.slice(0, 200)}`
    ).join("\n") || "No reports generated this week.";

    const alertsList = alerts.map((a: any) =>
      `- [${a.alert_type}] ${a.title}: ${a.description?.slice(0, 150)} (${(a.competitors as any)?.name || 'unknown'})`
    ).join("\n") || "No alerts this week.";

    const gapsList = gaps.map((g: any) =>
      `- ${g.gap_title} (Score: ${g.opportunity_score}/10, Category: ${g.gap_category}, Competitor: ${(g.competitors as any)?.name || 'unknown'}): ${g.gap_description?.slice(0, 150)}`
    ).join("\n") || "No market gaps identified.";

    // STEP 2 — AI briefing generation
    const systemPrompt = `You are a competitive intelligence executive advisor. Generate a weekly executive briefing for ${companyName} in the ${industry} industry.

Here is this week's competitive intelligence data:

- Active competitors being monitored:
${competitorsList}

- Analysis reports generated this week:
${reportsList}

- Alerts detected this week:
${alertsList}

- Top market opportunities:
${gapsList}

Create a structured executive briefing. Return ONLY valid JSON with these keys:

- briefing_title (string, e.g., "Weekly Competitive Briefing — Mar 10-16, 2026")
- executive_summary (string, 3-4 sentences capturing the most important takeaways this week)
- top_threats (array of objects with "competitor_name" string, "threat_score" integer, "summary" string describing why they're a threat this week — max 3)
- key_changes (array of objects with "competitor_name" string, "change_type" string, "description" string — significant changes detected this week)
- top_opportunities (array of objects with "title" string, "competitor_name" string, "opportunity_score" integer, "recommendation" string — top 3 actionable opportunities)
- recommended_actions (array of objects with "action" string, "priority" string one of high/medium/low, "reasoning" string — 3-5 specific things the team should do this week)
- competitive_landscape_summary (string, 2-3 sentences on overall market dynamics)
- outlook (string, 2-3 sentences on what to watch for next week)

Be strategic and executive-level. No fluff. Every point should be actionable or decision-relevant. Return ONLY valid JSON.`;

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
          { role: "user", content: `Generate the weekly executive briefing now. Today's date is ${new Date().toISOString().split("T")[0]}.` },
        ],
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ success: false, error: "AI credits exhausted. Please add funds." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway error [${res.status}]: ${t}`);
    }

    const aiData = await res.json();
    const raw = aiData.choices?.[0]?.message?.content || "";
    const parsed = tryParseJSON(raw);

    if (!parsed) {
      // Store partial
      const { data: report } = await supabase.from("analysis_reports").insert({
        user_id,
        competitor_id: null,
        report_type: "executive_briefing",
        title: "Weekly Executive Briefing (partial)",
        summary: "AI returned non-parseable response. Raw output saved.",
        full_report: { raw_response: raw, parse_error: true },
        ai_model_used: "google/gemini-3.1-pro-preview",
      }).select("id").single();

      return new Response(JSON.stringify({ success: true, partial: true, report_id: report?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 3 — Store as analysis_report
    const title = parsed.briefing_title || `Weekly Executive Briefing — ${new Date().toISOString().split("T")[0]}`;
    const summary = parsed.executive_summary || "Weekly competitive intelligence briefing generated.";

    const { data: report, error: reportError } = await supabase.from("analysis_reports").insert({
      user_id,
      competitor_id: null,
      report_type: "executive_briefing",
      title,
      summary,
      full_report: parsed,
      ai_model_used: "google/gemini-3.1-pro-preview",
    }).select("id").single();

    if (reportError) {
      console.error("Failed to insert briefing:", reportError);
      throw new Error("Failed to save briefing");
    }

    return new Response(JSON.stringify({
      success: true,
      report_id: report?.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Executive briefing error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
