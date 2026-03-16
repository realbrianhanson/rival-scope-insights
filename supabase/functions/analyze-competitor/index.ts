import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

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

async function callAI(apiKey: string, model: string, systemPrompt: string, userContent: string): Promise<any> {
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (res.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please add funds to your workspace.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway error [${res.status}]: ${t}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";
  const parsed = tryParseJSON(raw);
  return { parsed, raw, model };
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
    const { competitor_id, user_id, analysis_type } = await req.json();
    if (!competitor_id || !user_id || !analysis_type) {
      return new Response(JSON.stringify({ success: false, error: "competitor_id, user_id, and analysis_type are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validTypes = ["full_intel", "gap_analysis", "strengths_weaknesses", "review_sentiment"];
    if (!validTypes.includes(analysis_type)) {
      return new Response(JSON.stringify({ success: false, error: `Invalid analysis_type. Must be one of: ${validTypes.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 1 — Gather data
    const [scrapeRes, compRes, profileRes] = await Promise.all([
      supabase.from("scrape_results").select("*").eq("competitor_id", competitor_id)
        .order("scraped_at", { ascending: false }),
      supabase.from("competitors").select("name, industry, description, website_url").eq("id", competitor_id).single(),
      supabase.from("profiles").select("company_name, industry").eq("id", user_id).single(),
    ]);

    if (compRes.error || !compRes.data) throw new Error("Competitor not found");
    const competitor = compRes.data;
    const profile = profileRes.data || { company_name: "Unknown", industry: "Unknown" };
    let scrapeResults = scrapeRes.data || [];

    if (scrapeResults.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No scraped data available. Please run a scrape first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (analysis_type === "review_sentiment") {
      const reviewResults = scrapeResults.filter((r: any) => r.page_type === "review");
      if (reviewResults.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "No review data found. Scrape reviews first." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      scrapeResults = reviewResults;
    }

    const contentParts = scrapeResults.slice(0, 30).map((r: any) =>
      `--- PAGE: ${r.page_url} (type: ${r.page_type}) ---\n${(r.raw_content || "").slice(0, 5000)}`
    );
    const allContent = contentParts.join("\n\n");

    const companyName = profile.company_name || "our company";
    const industry = profile.industry || competitor.industry || "technology";

    // STEP 2 — AI analysis
    let model: string;
    let systemPrompt: string;

    if (analysis_type === "full_intel") {
      model = "google/gemini-3.1-pro-preview";
      systemPrompt = `You are a competitive intelligence analyst. Analyze this competitor's web presence and provide a structured JSON response with these exact keys: executive_summary (string, 2-3 sentences), strengths (array of objects with 'title' and 'detail' strings), weaknesses (array of objects with 'title' and 'detail' strings), market_gaps (array of objects with 'category' string one of: feature/content/pricing/positioning/audience, 'title' string, 'description' string, 'opportunity_score' integer 1-10, 'evidence' string), pricing_analysis (object with 'summary' string, 'tiers' array if found, 'strategy' string), content_strategy (object with 'summary' string, 'themes' array of strings, 'frequency' string, 'quality_assessment' string), messaging_analysis (object with 'value_proposition' string, 'target_audience' string, 'tone' string, 'key_claims' array of strings), tech_stack_hints (array of strings — any technologies detected from the HTML/content), recommendations (array of objects with 'action' string and 'priority' string one of: high/medium/low), risk_assessment (string). The user's company is ${companyName} in the ${industry} industry. Provide actionable intelligence, not generic observations. Return ONLY valid JSON, no markdown.`;
    } else if (analysis_type === "gap_analysis") {
      model = "google/gemini-3-flash-preview";
      systemPrompt = `You are a competitive intelligence analyst specializing in market gap identification. Analyze this competitor's web presence and find market gaps and opportunities. Return ONLY valid JSON with this structure: { "gaps": [{ "category": "feature|content|pricing|positioning|audience", "title": "string", "description": "string", "opportunity_score": 1-10, "evidence": "string" }] }. The user's company is ${companyName} in the ${industry} industry. Be specific and evidence-based. Return ONLY valid JSON, no markdown.`;
    } else if (analysis_type === "strengths_weaknesses") {
      model = "google/gemini-3-flash-preview";
      systemPrompt = `You are a competitive intelligence analyst. Analyze this competitor's web presence and identify their strengths and weaknesses. Return ONLY valid JSON with this structure: { "strengths": [{ "title": "string", "detail": "string" }], "weaknesses": [{ "title": "string", "detail": "string" }] }. The user's company is ${companyName} in the ${industry} industry. Be specific and actionable. Return ONLY valid JSON, no markdown.`;
    } else {
      model = "google/gemini-3-flash-preview";
      systemPrompt = `You are a review sentiment analyst. Analyze these competitor reviews and return ONLY valid JSON with this structure: { "overall_sentiment_score": 0-100, "positive_themes": [{ "theme": "string", "frequency": "string" }], "negative_themes": [{ "theme": "string", "frequency": "string" }], "requested_features": [{ "feature": "string", "demand_level": "string" }], "summary": "string" }. Return ONLY valid JSON, no markdown.`;
    }

    const userPrompt = `Competitor: ${competitor.name}\nWebsite: ${competitor.website_url}\nIndustry: ${competitor.industry || "Unknown"}\nDescription: ${competitor.description || "N/A"}\n\nScraped Content:\n${allContent}`;

    const { parsed, raw, model: usedModel } = await callAI(LOVABLE_API_KEY, model, systemPrompt, userPrompt);

    if (!parsed) {
      await supabase.from("analysis_reports").insert({
        user_id,
        competitor_id,
        report_type: analysis_type,
        title: `${analysis_type} analysis of ${competitor.name} (partial)`,
        summary: "AI returned non-parseable response. Raw output saved.",
        full_report: { raw_response: raw, parse_error: true },
        ai_model_used: usedModel,
        source_scrape_ids: scrapeResults.slice(0, 30).map((r: any) => r.id),
      });

      return new Response(JSON.stringify({ success: true, partial: true, error: "AI response could not be fully parsed. Partial report saved." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 3 — Store results
    const title = analysis_type === "full_intel"
      ? `Full Intelligence Report: ${competitor.name}`
      : analysis_type === "gap_analysis"
      ? `Gap Analysis: ${competitor.name}`
      : analysis_type === "strengths_weaknesses"
      ? `Strengths & Weaknesses: ${competitor.name}`
      : `Review Sentiment: ${competitor.name}`;

    const summary = parsed.executive_summary || parsed.summary || `${analysis_type} analysis completed for ${competitor.name}`;

    const { data: report, error: reportError } = await supabase.from("analysis_reports").insert({
      user_id,
      competitor_id,
      report_type: analysis_type,
      title,
      summary,
      full_report: parsed,
      ai_model_used: usedModel,
      source_scrape_ids: scrapeResults.slice(0, 30).map((r: any) => r.id),
    }).select("id").single();

    if (reportError) console.error("Failed to insert report:", reportError);
    const reportId = report?.id;

    // Insert market gaps
    const gaps = parsed.market_gaps || parsed.gaps || [];
    if (gaps.length > 0 && reportId) {
      const gapRows = gaps.map((g: any) => ({
        user_id,
        competitor_id,
        report_id: reportId,
        gap_title: g.title || "Untitled gap",
        gap_description: g.description || "",
        gap_category: g.category || "feature",
        opportunity_score: Math.min(10, Math.max(1, parseInt(g.opportunity_score) || 5)),
        evidence: g.evidence || "",
        status: "new",
      }));
      const { error: gapError } = await supabase.from("market_gaps").insert(gapRows);
      if (gapError) console.error("Failed to insert market gaps:", gapError);
    }

    // Insert review analysis
    if (analysis_type === "review_sentiment" && reportId) {
      await supabase.from("review_analyses").insert({
        user_id,
        competitor_id,
        source: "aggregated",
        overall_sentiment_score: parsed.overall_sentiment_score || 50,
        positive_themes: parsed.positive_themes || [],
        negative_themes: parsed.negative_themes || [],
        requested_features: parsed.requested_features || [],
        review_count: scrapeResults.length,
      });
    }

    // Create competitor snapshot
    const rawConcat = scrapeResults.map((r: any) => r.raw_content || "").join("");
    const contentHash = hashContent(rawConcat);
    const techStack = parsed.tech_stack_hints || null;

    // STEP 4 — Threat Score (full_intel only)
    let threatData: { threat_score: number; threat_level: string; primary_threat_reason: string; trend: string } | null = null;

    if (analysis_type === "full_intel") {
      try {
        const threatPrompt = `Based on this competitive intelligence analysis, assign a Threat Score from 1 to 100 that represents how much of a competitive threat this company poses to ${companyName}. Consider: the number and severity of their strengths, their pricing competitiveness, their content/marketing sophistication, their market positioning strength, and any direct overlap with ${companyName}'s target audience.

Return ONLY valid JSON: { "threat_score": integer 1-100, "threat_level": string one of "low"/"moderate"/"high"/"critical", "primary_threat_reason": string one sentence explaining the biggest reason they're a threat, "trend": string one of "increasing"/"stable"/"decreasing" based on available data }`;

        const threatResult = await callAI(LOVABLE_API_KEY, "google/gemini-3-flash-preview", threatPrompt, JSON.stringify(parsed));
        if (threatResult.parsed && typeof threatResult.parsed.threat_score === "number") {
          threatData = threatResult.parsed;
        }
      } catch (e) {
        console.error("Threat score generation failed (non-fatal):", e);
      }
    }

    await supabase.from("competitor_snapshots").insert({
      user_id,
      competitor_id,
      content_hash: contentHash,
      snapshot_data: {
        scraped_pages: scrapeResults.length,
        analysis_type,
        report_id: reportId,
        timestamp: new Date().toISOString(),
      },
      tech_stack: techStack ? { detected: techStack } : null,
      messaging_summary: parsed.messaging_analysis?.value_proposition || parsed.summary || null,
      threat_score: threatData?.threat_score ?? null,
      threat_level: threatData?.threat_level ?? null,
      threat_reason: threatData?.primary_threat_reason ?? null,
      threat_trend: threatData?.trend ?? null,
    });

    // Update competitor with threat score and timestamp
    const competitorUpdate: any = { updated_at: new Date().toISOString() };
    if (threatData) {
      competitorUpdate.threat_score = threatData.threat_score;
      competitorUpdate.threat_level = threatData.threat_level;
    }
    await supabase.from("competitors").update(competitorUpdate).eq("id", competitor_id);

    return new Response(JSON.stringify({
      success: true,
      report_id: reportId,
      analysis_type,
      gaps_found: gaps.length,
      threat_score: threatData?.threat_score ?? null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Analysis error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
