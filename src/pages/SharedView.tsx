import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Shield, Check, X, Minus, HelpCircle, Link2Off } from "lucide-react";

// Shared light-mode wrapper
function SharedLayout({ appName, children }: { appName: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[hsl(240,33%,14%)]">
      <header className="border-b border-[hsl(240,10%,90%)] px-6 py-4">
        <span className="text-lg font-bold tracking-tight">{appName}</span>
      </header>
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-[hsl(240,10%,90%)] px-6 py-4 text-center">
        <span className="text-xs text-[hsl(240,10%,60%)]">Powered by {appName}</span>
      </footer>
    </div>
  );
}

function ExpiredView() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[hsl(240,7%,95%)] flex items-center justify-center">
          <Link2Off className="h-7 w-7 text-[hsl(240,10%,50%)]" />
        </div>
        <h1 className="text-xl font-bold text-[hsl(240,33%,14%)]">This link is no longer available</h1>
        <p className="text-sm text-[hsl(240,10%,50%)]">The shared link has expired or been disabled by its owner.</p>
      </div>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[hsl(164,100%,42%)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// --- Report sections (light mode) ---
function ReportView({ report, appName }: { report: any; appName: string }) {
  const fullReport = report.full_report as any;
  const comp = report.competitors as any;

  return (
    <SharedLayout appName={appName}>
      <Helmet
        title={report.title}
        description={report.summary}
      />
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-[hsl(164,100%,42%)]/10 text-[hsl(164,100%,42%)]">
              {report.report_type?.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[hsl(240,10%,50%)] flex-wrap">
            {comp?.name && <span>{comp.name}</span>}
            <span>·</span>
            <span>{format(new Date(report.created_at), "MMM d, yyyy")}</span>
          </div>
        </div>

        {report.summary && (
          <div className="p-5 rounded-xl border border-[hsl(240,10%,90%)] border-l-4 border-l-[hsl(164,100%,42%)]">
            <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider mb-2">Executive Summary</h3>
            <p className="text-sm leading-relaxed">{report.summary}</p>
          </div>
        )}

        {/* Executive Briefing */}
        {report.report_type === "executive_briefing" && fullReport && (
          <ExecutiveBriefingShared report={fullReport} />
        )}

        {/* Full Intel sections */}
        {fullReport?.strengths?.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <BulletSection title="Strengths" items={fullReport.strengths} color="hsl(164,100%,42%)" />
            <BulletSection title="Weaknesses" items={fullReport.weaknesses || []} color="hsl(0,72%,51%)" />
          </div>
        )}

        {fullReport?.market_gaps?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider">Market Gaps</h3>
            {fullReport.market_gaps.map((g: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-[hsl(240,10%,90%)] flex items-start gap-3">
                <div className="w-9 h-9 rounded-full border-2 border-[hsl(164,100%,42%)] flex items-center justify-center text-sm font-bold text-[hsl(164,100%,42%)] flex-shrink-0">
                  {g.opportunity_score}
                </div>
                <div>
                  <p className="text-sm font-semibold">{g.title}</p>
                  <p className="text-xs text-[hsl(240,10%,50%)] mt-0.5">{g.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {fullReport?.recommendations?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider">Recommendations</h3>
            {fullReport.recommendations.map((r: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-[hsl(240,10%,90%)] flex items-center gap-3">
                <span className={cn(
                  "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                  r.priority === "high" ? "bg-[hsl(22,100%,60%)]/10 text-[hsl(22,100%,60%)]"
                    : r.priority === "medium" ? "bg-[hsl(44,100%,52%)]/10 text-[hsl(44,100%,52%)]"
                    : "bg-[hsl(240,7%,95%)] text-[hsl(240,10%,50%)]"
                )}>{r.priority}</span>
                <p className="text-sm">{r.action}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SharedLayout>
  );
}

function ExecutiveBriefingShared({ report }: { report: any }) {
  return (
    <div className="space-y-6">
      {report.top_threats?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider">Top Threats</h3>
          {report.top_threats.map((t: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border border-[hsl(240,10%,90%)] border-l-4 border-l-[hsl(0,72%,63%)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{t.competitor_name}</span>
                <span className="font-mono text-sm font-bold text-[hsl(0,72%,63%)]">{t.threat_score}/100</span>
              </div>
              <p className="text-sm text-[hsl(240,10%,50%)]">{t.summary}</p>
            </div>
          ))}
        </div>
      )}
      {report.top_opportunities?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider">Top Opportunities</h3>
          {report.top_opportunities.map((o: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border border-[hsl(240,10%,90%)] border-l-4 border-l-[hsl(164,100%,42%)]">
              <p className="text-sm font-semibold">{o.title}</p>
              <p className="text-sm text-[hsl(240,10%,50%)] mt-1">{o.recommendation}</p>
            </div>
          ))}
        </div>
      )}
      {report.recommended_actions?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider">Recommended Actions</h3>
          {report.recommended_actions.map((a: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border border-[hsl(240,10%,90%)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-bold text-[hsl(240,10%,50%)]">{i + 1}.</span>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
                  a.priority === "high" ? "bg-[hsl(22,100%,60%)]/10 text-[hsl(22,100%,60%)]" : "bg-[hsl(240,7%,95%)] text-[hsl(240,10%,50%)]"
                )}>{a.priority}</span>
                <span className="text-sm font-semibold">{a.action}</span>
              </div>
              <p className="text-xs text-[hsl(240,10%,50%)] ml-7">{a.reasoning}</p>
            </div>
          ))}
        </div>
      )}
      {(report.competitive_landscape_summary || report.outlook) && (
        <div className="p-5 rounded-xl border border-[hsl(240,10%,90%)] border-l-4 border-l-[hsl(252,72%,64%)]">
          {report.competitive_landscape_summary && <p className="text-sm mb-2">{report.competitive_landscape_summary}</p>}
          {report.outlook && (
            <>
              <p className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider mb-1">Next Week</p>
              <p className="text-sm">{report.outlook}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BulletSection({ title, items, color }: { title: string; items: any[]; color: string }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider">{title}</h3>
      {items.map((item: any, i: number) => (
        <div key={i} className="p-3 rounded-lg border border-[hsl(240,10%,90%)]" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
          <p className="text-sm font-semibold">{item.title || item}</p>
          {item.detail && <p className="text-xs text-[hsl(240,10%,50%)] mt-0.5">{item.detail}</p>}
        </div>
      ))}
    </div>
  );
}

// --- Battlecard view ---
function BattlecardView({ battlecard, appName }: { battlecard: any; appName: string }) {
  const comp = battlecard.competitors as any;
  const strengths = (Array.isArray(battlecard.their_strengths) ? battlecard.their_strengths : []) as string[];
  const weaknesses = (Array.isArray(battlecard.their_weaknesses) ? battlecard.their_weaknesses : []) as string[];
  const counterPos = (Array.isArray(battlecard.counter_positioning) ? battlecard.counter_positioning : []) as any[];
  const talkTracks = (Array.isArray(battlecard.talk_tracks) ? battlecard.talk_tracks : []) as string[];
  const differentiators = (Array.isArray(battlecard.key_differentiators) ? battlecard.key_differentiators : []) as string[];
  const pricing = battlecard.pricing_comparison as any;

  return (
    <SharedLayout appName={appName}>
      <Helmet
        title={`Sales Battlecard: ${comp?.name || "Unknown"}`}
        description={battlecard.overview}
      />
      <div className="space-y-6 print:space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[hsl(164,100%,42%)]" />
          <h1 className="text-2xl font-bold">Sales Battlecard: {comp?.name || "Unknown"}</h1>
        </div>
        <p className="text-xs text-[hsl(240,10%,50%)]">
          Updated {format(new Date(battlecard.updated_at), "MMM d, yyyy")}
        </p>

        {battlecard.overview && (
          <div className="p-5 rounded-xl border border-[hsl(240,10%,90%)] border-l-4 border-l-[hsl(164,100%,42%)]">
            <p className="text-sm leading-relaxed">{battlecard.overview}</p>
          </div>
        )}

        {strengths.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider mb-3">Their Strengths</h3>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(164,100%,42%)" }} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {weaknesses.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider mb-3">Their Weaknesses</h3>
            <ul className="space-y-2">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[hsl(0,72%,51%)] flex-shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {counterPos.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider mb-3">Counter-Positioning</h3>
            <div className="border border-[hsl(240,10%,90%)] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[hsl(240,7%,97%)]">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider">Objection</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider">Your Response</th>
                  </tr>
                </thead>
                <tbody>
                  {counterPos.map((cp, i) => (
                    <tr key={i} className="border-t border-[hsl(240,10%,90%)]">
                      <td className="px-4 py-3 font-medium">{cp.objection || cp}</td>
                      <td className="px-4 py-3 text-[hsl(240,10%,40%)]">{cp.response || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pricing && (
          <div>
            <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider mb-3">Pricing Comparison</h3>
            <div className="p-4 rounded-xl border border-[hsl(240,10%,90%)]">
              {pricing.summary && <p className="text-sm mb-2">{pricing.summary}</p>}
              {pricing.their_price_range && <p className="font-mono text-lg font-bold">{pricing.their_price_range}</p>}
            </div>
          </div>
        )}

        {talkTracks.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider mb-3">Talk Tracks</h3>
            <ol className="space-y-2">
              {talkTracks.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="font-bold text-[hsl(240,10%,50%)] flex-shrink-0">{i + 1}.</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        )}

        {differentiators.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider mb-3">Key Differentiators</h3>
            <div className="flex flex-wrap gap-2">
              {differentiators.map((d, i) => (
                <span key={i} className="text-sm px-3 py-1.5 rounded-full bg-[hsl(164,100%,42%)]/10 text-[hsl(164,100%,42%)] font-medium">{d}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </SharedLayout>
  );
}

// --- Comparison view ---
function StatusIcon({ status }: { status: string }) {
  const size = "w-6 h-6";
  switch (status) {
    case "yes": return <div className={`${size} rounded-full bg-[hsl(164,100%,42%)] flex items-center justify-center`}><Check className="h-3 w-3 text-white" /></div>;
    case "no": return <div className={`${size} rounded-full bg-[hsl(0,72%,51%)] flex items-center justify-center`}><X className="h-3 w-3 text-white" /></div>;
    case "partial": return <div className={`${size} rounded-full bg-[hsl(44,100%,52%)] flex items-center justify-center`}><Minus className="h-3 w-3 text-white" /></div>;
    default: return <div className={`${size} rounded-full bg-[hsl(240,7%,95%)] flex items-center justify-center`}><HelpCircle className="h-3 w-3 text-[hsl(240,10%,50%)]" /></div>;
  }
}

function ComparisonView({ matrix, appName }: { matrix: any; appName: string }) {
  const categories = (matrix.categories as any[]) || [];
  const matrixData = matrix.matrix_data as any;
  let competitorNames: string[] = [];
  for (const cat of categories) {
    for (const feat of cat.features || []) {
      if (feat.values && typeof feat.values === "object") {
        competitorNames = Object.keys(feat.values);
        break;
      }
    }
    if (competitorNames.length > 0) break;
  }

  return (
    <SharedLayout appName={appName}>
      <Helmet title={matrix.title} description={matrix.description} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{matrix.title}</h1>
          {matrix.description && <p className="text-sm text-[hsl(240,10%,50%)] mt-1">{matrix.description}</p>}
          <p className="text-xs text-[hsl(240,10%,50%)] mt-1">{format(new Date(matrix.created_at), "MMM d, yyyy")}</p>
        </div>

        <div className="border border-[hsl(240,10%,90%)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="bg-[hsl(240,7%,97%)] border-b border-[hsl(240,10%,90%)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider w-[200px]">Feature</th>
                  {competitorNames.map((name) => (
                    <th key={name} className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider">{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat: any, ci: number) => (
                  <>
                    <tr key={`cat-${ci}`}>
                      <td colSpan={competitorNames.length + 1} className="bg-[hsl(240,7%,97%)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em]">
                        {cat.name}
                      </td>
                    </tr>
                    {(cat.features || []).map((feat: any, fi: number) => (
                      <tr key={`${ci}-${fi}`} className="border-b border-[hsl(240,10%,93%)]">
                        <td className="px-4 py-2.5 font-medium">{feat.name}</td>
                        {competitorNames.map((name) => {
                          const val = feat.values?.[name];
                          return (
                            <td key={name} className="px-4 py-2.5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <StatusIcon status={val?.status || "unknown"} />
                                {val?.detail && <span className="text-[10px] text-[hsl(240,10%,50%)]">{val.detail}</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {matrixData?.your_advantages?.length > 0 && (
          <div className="p-5 rounded-xl border border-[hsl(240,10%,90%)] border-l-4 border-l-[hsl(164,100%,42%)]">
            <h3 className="text-xs font-semibold text-[hsl(240,10%,50%)] uppercase tracking-wider mb-3">Your Advantages</h3>
            <ul className="space-y-2">
              {matrixData.your_advantages.map((a: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(164,100%,42%)" }} />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SharedLayout>
  );
}

// Simple meta tag helper
function Helmet({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    document.title = title;
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("og:title", title);
    if (description) setMeta("og:description", description);
  }, [title, description]);
  return null;
}

// --- Main page ---
export default function SharedView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [contentType, setContentType] = useState<string>("");
  const [content, setContent] = useState<any>(null);
  const [appName, setAppName] = useState("RivalScope");

  useEffect(() => {
    if (!token) { setInvalid(true); setLoading(false); return; }

    const load = async () => {
      try {
        // Look up share link
        const { data: link, error: linkError } = await supabase
          .from("shared_links" as any)
          .select("*")
          .eq("share_token", token)
          .eq("is_active", true)
          .maybeSingle();

        if (linkError || !link) { setInvalid(true); setLoading(false); return; }

        // Check expiration
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
          setInvalid(true); setLoading(false); return;
        }

        // Increment view count
        await supabase
          .from("shared_links" as any)
          .update({ view_count: (link.view_count || 0) + 1 })
          .eq("id", link.id);

        // Fetch content based on type
        const ct = link.content_type;
        setContentType(ct);

        if (ct === "report") {
          const { data } = await supabase
            .from("analysis_reports")
            .select("*, competitors(name)")
            .eq("id", link.content_id)
            .single();
          if (!data) { setInvalid(true); setLoading(false); return; }
          setContent(data);

          // Get app name
          const { data: settings } = await supabase
            .from("app_settings")
            .select("app_name")
            .eq("user_id", link.user_id)
            .maybeSingle();
          if (settings?.app_name) setAppName(settings.app_name);
        } else if (ct === "battlecard") {
          const { data } = await supabase
            .from("battlecards")
            .select("*, competitors(name)")
            .eq("id", link.content_id)
            .single();
          if (!data) { setInvalid(true); setLoading(false); return; }
          setContent(data);

          const { data: settings } = await supabase
            .from("app_settings")
            .select("app_name")
            .eq("user_id", link.user_id)
            .maybeSingle();
          if (settings?.app_name) setAppName(settings.app_name);
        } else if (ct === "comparison") {
          const { data } = await supabase
            .from("comparison_matrices")
            .select("*")
            .eq("id", link.content_id)
            .single();
          if (!data) { setInvalid(true); setLoading(false); return; }
          setContent(data);

          const { data: settings } = await supabase
            .from("app_settings")
            .select("app_name")
            .eq("user_id", link.user_id)
            .maybeSingle();
          if (settings?.app_name) setAppName(settings.app_name);
        } else {
          setInvalid(true);
        }
      } catch (e) {
        console.error("Shared view error:", e);
        setInvalid(true);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  if (loading) return <LoadingView />;
  if (invalid || !content) return <ExpiredView />;

  if (contentType === "report") return <ReportView report={content} appName={appName} />;
  if (contentType === "battlecard") return <BattlecardView battlecard={content} appName={appName} />;
  if (contentType === "comparison") return <ComparisonView matrix={content} appName={appName} />;

  return <ExpiredView />;
}
