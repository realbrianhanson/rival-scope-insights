import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(str: string): string {
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderBullets(items: any[], color: string): string {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items.map((item) => {
    const text = typeof item === "string" ? item : item?.title || item?.detail || JSON.stringify(item);
    const detail = typeof item === "object" && item?.detail ? `<br/><span style="color:#6B6B80;font-size:12px;">${escapeHtml(item.detail)}</span>` : "";
    return `<li style="margin-bottom:6px;"><span style="color:${color};font-weight:600;">●</span> ${escapeHtml(text)}${detail}</li>`;
  }).join("");
}

function generateReportHtml(report: any, competitor: any, appName: string, companyName: string): string {
  const fr = report.full_report || {};
  const date = new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  let sections = "";

  // Executive Summary
  if (report.summary) {
    sections += `
      <div style="border-left:4px solid #00D4AA;padding:16px 20px;background:#f8fffe;margin-bottom:24px;border-radius:0 8px 8px 0;">
        <h2 style="font-size:14px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Executive Summary</h2>
        <p style="font-size:14px;line-height:1.6;color:#1a1a2e;margin:0;">${escapeHtml(report.summary)}</p>
      </div>`;
  }

  // Strengths
  if (fr.strengths?.length) {
    sections += `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:14px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Strengths</h2>
        <ul style="list-style:none;padding:0;margin:0;">${renderBullets(fr.strengths, "#00D4AA")}</ul>
      </div>`;
  }

  // Weaknesses
  if (fr.weaknesses?.length) {
    sections += `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:14px;color:#FF4757;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Weaknesses</h2>
        <ul style="list-style:none;padding:0;margin:0;">${renderBullets(fr.weaknesses, "#FF4757")}</ul>
      </div>`;
  }

  // Market Gaps
  if (fr.market_gaps?.length) {
    sections += `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:14px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Market Gaps</h2>
        ${fr.market_gaps.map((g: any) => `
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;padding:12px;border:1px solid #e0e0e0;border-radius:8px;">
            <div style="width:36px;height:36px;border-radius:50%;border:2px solid #00D4AA;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#00D4AA;flex-shrink:0;">${g.opportunity_score || "?"}</div>
            <div>
              <strong style="font-size:14px;color:#1a1a2e;">${escapeHtml(g.title || "")}</strong>
              ${g.category ? `<span style="font-size:10px;background:#00D4AA20;color:#00D4AA;padding:2px 8px;border-radius:10px;margin-left:8px;text-transform:uppercase;">${escapeHtml(g.category)}</span>` : ""}
              <p style="font-size:13px;color:#555;margin:4px 0 0 0;">${escapeHtml(g.description || "")}</p>
            </div>
          </div>
        `).join("")}
      </div>`;
  }

  // Pricing Analysis
  if (fr.pricing_analysis) {
    sections += `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:14px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Pricing Analysis</h2>
        <div style="padding:16px;border:1px solid #e0e0e0;border-radius:8px;">
          <p style="font-size:14px;color:#1a1a2e;margin:0;">${escapeHtml(fr.pricing_analysis.summary || "")}</p>
          ${fr.pricing_analysis.strategy ? `<p style="font-size:13px;color:#555;margin:8px 0 0 0;"><strong>Strategy:</strong> ${escapeHtml(fr.pricing_analysis.strategy)}</p>` : ""}
        </div>
      </div>`;
  }

  // Recommendations
  if (fr.recommendations?.length) {
    const priorityColors: Record<string, string> = { high: "#FF6B35", medium: "#FFBE0B", low: "#9898B0" };
    sections += `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:14px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Recommendations</h2>
        ${fr.recommendations.map((r: any) => `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:10px 14px;border:1px solid #e0e0e0;border-radius:8px;">
            <span style="font-size:10px;text-transform:uppercase;font-weight:700;color:${priorityColors[r.priority] || "#9898B0"};padding:2px 8px;border-radius:10px;background:${priorityColors[r.priority] || "#9898B0"}20;">${escapeHtml(r.priority || "")}</span>
            <span style="font-size:13px;color:#1a1a2e;">${escapeHtml(r.action || "")}</span>
          </div>
        `).join("")}
      </div>`;
  }

  // Risk Assessment
  if (fr.risk_assessment) {
    sections += `
      <div style="margin-bottom:24px;border-left:4px solid #FFBE0B;padding:16px 20px;background:#fffef5;border-radius:0 8px 8px 0;">
        <h2 style="font-size:14px;color:#FFBE0B;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Risk Assessment</h2>
        <p style="font-size:14px;color:#1a1a2e;margin:0;">${escapeHtml(fr.risk_assessment)}</p>
      </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title>
<style>
  body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin:0; padding:40px; color:#1a1a2e; background:#fff; max-width:800px; margin:0 auto; padding:40px; }
  @page { margin: 20mm; }
</style></head><body>
  <div style="border-bottom:2px solid #00D4AA;padding-bottom:16px;margin-bottom:32px;">
    <p style="font-size:12px;color:#00D4AA;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px 0;font-weight:700;">${escapeHtml(appName)}</p>
    <h1 style="font-size:24px;font-weight:700;margin:0 0 4px 0;color:#1a1a2e;">Competitive Intelligence Report</h1>
    <p style="font-size:14px;color:#6B6B80;margin:0;">${escapeHtml(competitor?.name || "Unknown Competitor")} · ${date}</p>
  </div>
  ${sections}
  <div style="border-top:1px solid #e0e0e0;padding-top:16px;margin-top:40px;text-align:center;">
    <p style="font-size:11px;color:#9898B0;">Generated by ${escapeHtml(appName)} · ${date}</p>
  </div>
</body></html>`;
}

function generateBattlecardHtml(bc: any, competitor: any, appName: string): string {
  const date = new Date(bc.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const strengths = Array.isArray(bc.their_strengths) ? bc.their_strengths : [];
  const weaknesses = Array.isArray(bc.their_weaknesses) ? bc.their_weaknesses : [];
  const counterPos = Array.isArray(bc.counter_positioning) ? bc.counter_positioning : [];
  const talkTracks = Array.isArray(bc.talk_tracks) ? bc.talk_tracks : [];
  const differentiators = Array.isArray(bc.key_differentiators) ? bc.key_differentiators : [];
  const pricing = bc.pricing_comparison;

  let sections = "";

  // Overview
  if (bc.overview) {
    sections += `
      <div style="border-left:4px solid #00D4AA;padding:14px 18px;background:#f8fffe;margin-bottom:20px;border-radius:0 8px 8px 0;">
        <h2 style="font-size:13px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0;">Overview</h2>
        <p style="font-size:13px;line-height:1.5;color:#1a1a2e;margin:0;">${escapeHtml(bc.overview)}</p>
      </div>`;
  }

  // Strengths & Weaknesses side by side
  if (strengths.length || weaknesses.length) {
    sections += `<div style="display:flex;gap:16px;margin-bottom:20px;">`;
    if (strengths.length) {
      sections += `<div style="flex:1;"><h2 style="font-size:13px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Their Strengths</h2>
        <ul style="list-style:none;padding:0;margin:0;">${renderBullets(strengths, "#00D4AA")}</ul></div>`;
    }
    if (weaknesses.length) {
      sections += `<div style="flex:1;"><h2 style="font-size:13px;color:#FF4757;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Their Weaknesses</h2>
        <ul style="list-style:none;padding:0;margin:0;">${renderBullets(weaknesses, "#FF4757")}</ul></div>`;
    }
    sections += `</div>`;
  }

  // Counter-Positioning
  if (counterPos.length) {
    sections += `
      <div style="margin-bottom:20px;">
        <h2 style="font-size:13px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Counter-Positioning</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#f0f0f5;"><th style="text-align:left;padding:8px 12px;border:1px solid #e0e0e0;">Objection</th><th style="text-align:left;padding:8px 12px;border:1px solid #e0e0e0;">Your Response</th></tr></thead>
          <tbody>${counterPos.map((cp: any) => `<tr><td style="padding:8px 12px;border:1px solid #e0e0e0;vertical-align:top;">${escapeHtml(cp.objection || String(cp))}</td><td style="padding:8px 12px;border:1px solid #e0e0e0;vertical-align:top;">${escapeHtml(cp.response || "")}</td></tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  // Pricing
  if (pricing) {
    sections += `
      <div style="margin-bottom:20px;">
        <h2 style="font-size:13px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Pricing Comparison</h2>
        <div style="padding:12px 16px;border:1px solid #e0e0e0;border-radius:8px;">
          ${pricing.summary ? `<p style="font-size:13px;color:#1a1a2e;margin:0 0 4px 0;">${escapeHtml(pricing.summary)}</p>` : ""}
          ${pricing.their_price_range ? `<p style="font-size:13px;color:#555;margin:0;"><strong>Their range:</strong> ${escapeHtml(pricing.their_price_range)}</p>` : ""}
        </div>
      </div>`;
  }

  // Talk Tracks
  if (talkTracks.length) {
    sections += `
      <div style="margin-bottom:20px;">
        <h2 style="font-size:13px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Talk Tracks</h2>
        <ol style="padding-left:20px;margin:0;">${talkTracks.map((t: any) => `<li style="font-size:13px;color:#1a1a2e;margin-bottom:6px;line-height:1.5;">${escapeHtml(typeof t === "string" ? t : JSON.stringify(t))}</li>`).join("")}</ol>
      </div>`;
  }

  // Differentiators
  if (differentiators.length) {
    sections += `
      <div style="margin-bottom:20px;">
        <h2 style="font-size:13px;color:#00D4AA;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Key Differentiators</h2>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${differentiators.map((d: any) => `<span style="font-size:12px;padding:4px 12px;border-radius:16px;background:#00D4AA20;color:#00997a;font-weight:600;">${escapeHtml(typeof d === "string" ? d : JSON.stringify(d))}</span>`).join("")}</div>
      </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Battlecard: ${escapeHtml(competitor?.name || "Unknown")}</title>
<style>
  body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin:0; padding:32px; color:#1a1a2e; background:#fff; max-width:800px; margin:0 auto; }
  @page { margin: 16mm; }
</style></head><body>
  <div style="border-bottom:2px solid #00D4AA;padding-bottom:14px;margin-bottom:24px;">
    <p style="font-size:12px;color:#00D4AA;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px 0;font-weight:700;">${escapeHtml(appName)}</p>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 2px 0;color:#1a1a2e;">Sales Battlecard vs ${escapeHtml(competitor?.name || "Unknown")}</h1>
    <p style="font-size:13px;color:#6B6B80;margin:0;">${date}</p>
  </div>
  ${sections}
  <div style="border-top:1px solid #e0e0e0;padding-top:12px;margin-top:32px;text-align:center;">
    <p style="font-size:11px;color:#9898B0;">Generated by ${escapeHtml(appName)} — Confidential</p>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, content_type, content_id } = await req.json();
    if (!user_id || !content_type || !content_id) throw new Error("Missing required fields");

    // Pull app settings
    const { data: settings } = await supabase.from("app_settings").select("app_name").eq("user_id", user_id).maybeSingle();
    const { data: profile } = await supabase.from("profiles").select("company_name").eq("id", user_id).single();
    const appName = settings?.app_name || "RivalScope";
    const companyName = profile?.company_name || "";

    let html = "";
    let competitorName = "unknown";

    if (content_type === "report") {
      const { data: report, error } = await supabase
        .from("analysis_reports")
        .select("*, competitors(name)")
        .eq("id", content_id)
        .eq("user_id", user_id)
        .single();
      if (error || !report) throw new Error("Report not found");
      competitorName = (report as any).competitors?.name || "unknown";
      html = generateReportHtml(report, (report as any).competitors, appName, companyName);
    } else if (content_type === "battlecard") {
      const { data: bc, error } = await supabase
        .from("battlecards")
        .select("*, competitors(name)")
        .eq("id", content_id)
        .eq("user_id", user_id)
        .single();
      if (error || !bc) throw new Error("Battlecard not found");
      competitorName = (bc as any).competitors?.name || "unknown";
      html = generateBattlecardHtml(bc, (bc as any).competitors, appName);
    } else {
      throw new Error("Invalid content_type");
    }

    // Upload HTML to storage
    const safeName = competitorName.replace(/[^a-zA-Z0-9-_]/g, "_").toLowerCase();
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `${content_type}-${safeName}-${dateStr}.html`;
    const filePath = `${user_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(filePath, new Blob([html], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("exports").getPublicUrl(filePath);

    return new Response(JSON.stringify({ success: true, url: urlData.publicUrl, fileName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pdf error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
