import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, message, conversation_history } = await req.json();
    if (!user_id || !message) throw new Error("user_id and message are required");

    // Step 1: Gather context
    const [profileRes, competitorsRes, reportsRes, gapsRes, alertsRes] = await Promise.all([
      supabase.from("profiles").select("company_name, industry").eq("id", user_id).single(),
      supabase.from("competitors").select("id, name, website_url, status").eq("user_id", user_id),
      supabase.from("analysis_reports").select("title, summary, report_type, created_at").eq("user_id", user_id).order("created_at", { ascending: false }).limit(3),
      supabase.from("market_gaps").select("gap_title, gap_description, gap_category, opportunity_score, evidence").eq("user_id", user_id).order("opportunity_score", { ascending: false }).limit(10),
      supabase.from("alerts").select("title, description, alert_type, created_at").eq("user_id", user_id).order("created_at", { ascending: false }).limit(5),
    ]);

    const profile = profileRes.data;
    const competitors = competitorsRes.data || [];
    const reports = reportsRes.data || [];
    const gaps = gapsRes.data || [];
    const alerts = alertsRes.data || [];

    // Check if message mentions a specific competitor
    let specificCompetitorReport = "";
    const msgLower = message.toLowerCase();
    const mentionedComp = competitors.find((c: any) => msgLower.includes(c.name.toLowerCase()));
    if (mentionedComp) {
      const { data: fullReport } = await supabase
        .from("analysis_reports")
        .select("full_report, title")
        .eq("competitor_id", mentionedComp.id)
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fullReport) {
        const reportStr = typeof fullReport.full_report === "string" ? fullReport.full_report : JSON.stringify(fullReport.full_report);
        // Truncate to ~4000 chars to keep context manageable
        specificCompetitorReport = `\n- Detailed intelligence on ${mentionedComp.name} (from "${fullReport.title}"): ${reportStr.slice(0, 4000)}`;
      }
    }

    const compList = competitors.map((c: any) => `${c.name} (${c.website_url}, status: ${c.status})`).join("; ") || "None";
    const reportSummaries = reports.map((r: any) => `[${r.report_type}] ${r.title}: ${r.summary}`).join("\n") || "None";
    const gapsList = gaps.map((g: any) => `- ${g.gap_title} (score: ${g.opportunity_score}/10, category: ${g.gap_category}): ${g.gap_description}`).join("\n") || "None";
    const alertsList = alerts.map((a: any) => `- [${a.alert_type}] ${a.title}: ${a.description}`).join("\n") || "None";

    const systemPrompt = `You are RivalScope AI, a competitive intelligence assistant. You have access to the user's competitive intelligence data. The user's company is "${profile?.company_name || "Unknown"}" in the "${profile?.industry || "Unknown"}" industry.

Here is their current competitive intelligence data:

- Competitors being tracked: ${compList}

- Recent analysis summaries:
${reportSummaries}

- Top market opportunities:
${gapsList}

- Recent alerts:
${alertsList}
${specificCompetitorReport}

Answer the user's question using ONLY the data provided. Be specific, actionable, and concise. If asked to write content (emails, posts, talking points), base it on the actual intelligence data. If you don't have enough data to answer, say so and suggest they run a new scan. Format your response in clean markdown. Never make up data that isn't in the provided context.`;

    // Step 2: Call Lovable AI with streaming
    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversation_history || []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in your workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
