import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useReportDetail } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  ExternalLink,
  Download,
  Share2,
} from "lucide-react";
import { useExportPdf } from "@/hooks/useExportPdf";
import { ShareLinkModal } from "@/components/ShareLinkModal";

const reportTypeColors: Record<string, string> = {
  full_intel: "bg-[hsl(164,100%,42%)]/10 text-[hsl(164,100%,42%)]",
  gap_analysis: "bg-[hsl(252,72%,64%)]/10 text-[hsl(252,72%,64%)]",
  strengths_weaknesses: "bg-[hsl(174,52%,55%)]/10 text-[hsl(174,52%,55%)]",
  comparison: "bg-[hsl(44,100%,52%)]/10 text-[hsl(44,100%,52%)]",
  battlecard: "bg-[hsl(22,100%,60%)]/10 text-[hsl(22,100%,60%)]",
  review_sentiment: "bg-muted text-muted-foreground",
  executive_briefing: "bg-[hsl(240,7%,95%)] text-[hsl(240,10%,4%)]",
};

const reportTypeLabels: Record<string, string> = {
  full_intel: "Full Intelligence",
  gap_analysis: "Gap Analysis",
  strengths_weaknesses: "Strengths & Weaknesses",
  comparison: "Comparison",
  battlecard: "Battlecard",
  review_sentiment: "Review Sentiment",
  executive_briefing: "Executive Briefing",
};

const priorityColors: Record<string, string> = {
  high: "bg-[hsl(22,100%,60%)]/10 text-[hsl(22,100%,60%)]",
  medium: "bg-[hsl(44,100%,52%)]/10 text-[hsl(44,100%,52%)]",
  low: "bg-muted text-muted-foreground",
};

function TabSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="h-4 w-1/3 skeleton-shimmer rounded" />
          <div className="h-3 w-2/3 skeleton-shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 8 ? "text-primary" : score >= 5 ? "text-warning-medium" : "text-muted-foreground";
  return (
    <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0", color, "border-current")}>
      {score}
    </div>
  );
}

const categoryColors: Record<string, string> = {
  feature: "bg-primary/10 text-primary",
  content: "bg-accent/10 text-accent",
  pricing: "bg-warning-medium/10 text-warning-medium",
  positioning: "bg-info/10 text-info",
  audience: "bg-destructive/10 text-destructive",
};

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: report, isLoading, refetch } = useReportDetail(id);
  const [regenerating, setRegenerating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { exporting, exportPdf } = useExportPdf();
  useDocumentTitle(report?.title || "Report");

  const fullReport = report?.full_report as any;
  const comp = report?.competitors as any;

  const handleRegenerate = async () => {
    if (!user || !report) return;
    setRegenerating(true);
    toast.info("Regenerating report...");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-competitor", {
        body: {
          competitor_id: report.competitor_id,
          user_id: user.id,
          analysis_type: report.report_type,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success && !data?.partial) throw new Error(data?.error || "Failed");
      toast.success("Report regenerated!");
      if (data?.report_id) {
        navigate(`/reports/${data.report_id}`, { replace: true });
      } else {
        refetch();
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setRegenerating(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 skeleton-shimmer rounded" />
          <div className="h-4 w-64 skeleton-shimmer rounded" />
          <TabSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (!report) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Report not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/reports")}>Back to Reports</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        {/* Back */}
        <AnimatedItem>
          <button
            onClick={() => navigate("/reports")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Reports
          </button>
        </AnimatedItem>

        {/* Header */}
        <AnimatedItem>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-[28px] font-bold text-foreground">{report.title}</h1>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
                  reportTypeColors[report.report_type] || "bg-muted text-muted-foreground"
                )}>
                  {reportTypeLabels[report.report_type] || report.report_type}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {comp?.name && <span>{comp.name}</span>}
                <span>·</span>
                <span>{format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted">{report.ai_model_used}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
                <Share2 className="mr-1.5 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportPdf("report", report.id)} disabled={exporting}>
                {exporting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                Regenerate Report
              </Button>
            </div>
          </div>
        </AnimatedItem>

        {/* Executive Summary */}
        {report.summary && (
          <AnimatedItem>
            <div className="bg-card border border-border rounded-xl p-6 border-l-4 border-l-primary">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Executive Summary</h3>
              <p className="text-sm text-foreground leading-relaxed">{report.summary}</p>
            </div>
          </AnimatedItem>
        )}

        {/* Dynamic content by type */}
        <AnimatedItem>
          {report.report_type === "full_intel" && fullReport && <FullIntelSections report={fullReport} />}
          {report.report_type === "gap_analysis" && fullReport && <GapAnalysisSection report={fullReport} />}
          {report.report_type === "strengths_weaknesses" && fullReport && <StrengthsWeaknessesSection report={fullReport} />}
          {report.report_type === "review_sentiment" && fullReport && <ReviewSentimentSection report={fullReport} />}
          {report.report_type === "executive_briefing" && fullReport && <ExecutiveBriefingSection report={fullReport} />}
        </AnimatedItem>
      </AnimatedPage>
    </AppLayout>
  );
}

// --- FULL INTEL ---
function FullIntelSections({ report }: { report: any }) {
  return (
    <div className="space-y-6">
      {/* Strengths & Weaknesses */}
      {(report.strengths?.length > 0 || report.weaknesses?.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Strengths</h3>
            {(report.strengths || []).map((s: any, i: number) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 border-l-4 border-l-primary">
                <p className="text-sm font-semibold text-foreground">{s.title || s}</p>
                {s.detail && <p className="text-xs text-muted-foreground mt-1">{s.detail}</p>}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Weaknesses</h3>
            {(report.weaknesses || []).map((w: any, i: number) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 border-l-4 border-l-destructive">
                <p className="text-sm font-semibold text-foreground">{w.title || w}</p>
                {w.detail && <p className="text-xs text-muted-foreground mt-1">{w.detail}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Gaps */}
      {report.market_gaps?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Market Gaps</h3>
          {report.market_gaps.map((gap: any, i: number) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
              <ScoreCircle score={gap.opportunity_score || 5} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{gap.title}</h4>
                  <span className={cn("text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
                    categoryColors[gap.category] || "bg-muted text-muted-foreground"
                  )}>{gap.category}</span>
                </div>
                <p className="text-xs text-muted-foreground">{gap.description}</p>
                {gap.evidence && <p className="text-xs text-muted-foreground/70 mt-1 italic">Evidence: {gap.evidence}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing Analysis */}
      {report.pricing_analysis && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pricing Analysis</h3>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-foreground">{report.pricing_analysis.summary}</p>
            {report.pricing_analysis.strategy && (
              <p className="text-sm text-muted-foreground mt-2"><strong>Strategy:</strong> {report.pricing_analysis.strategy}</p>
            )}
            {report.pricing_analysis.tiers?.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-3 mt-4">
                {report.pricing_analysis.tiers.map((tier: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                    <p className="text-sm font-semibold text-foreground">{tier.name || tier.tier || `Tier ${i + 1}`}</p>
                    {tier.price && <p className="text-lg font-bold text-primary mt-1">{tier.price}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Strategy */}
      {report.content_strategy && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Content Strategy</h3>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-foreground">{report.content_strategy.summary}</p>
            {report.content_strategy.themes?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {report.content_strategy.themes.map((t: string, i: number) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 text-accent">{t}</span>
                ))}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {report.content_strategy.frequency && (
                <div><p className="text-xs text-muted-foreground">Frequency</p><p className="text-sm font-medium text-foreground">{report.content_strategy.frequency}</p></div>
              )}
              {report.content_strategy.quality_assessment && (
                <div><p className="text-xs text-muted-foreground">Quality</p><p className="text-sm font-medium text-foreground">{report.content_strategy.quality_assessment}</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messaging Analysis */}
      {report.messaging_analysis && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Messaging Analysis</h3>
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            {report.messaging_analysis.value_proposition && (
              <div><p className="text-xs text-muted-foreground">Value Proposition</p><p className="text-sm text-foreground">{report.messaging_analysis.value_proposition}</p></div>
            )}
            {report.messaging_analysis.target_audience && (
              <div><p className="text-xs text-muted-foreground">Target Audience</p><p className="text-sm text-foreground">{report.messaging_analysis.target_audience}</p></div>
            )}
            {report.messaging_analysis.tone && (
              <div><p className="text-xs text-muted-foreground">Tone</p><p className="text-sm text-foreground">{report.messaging_analysis.tone}</p></div>
            )}
            {report.messaging_analysis.key_claims?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Key Claims</p>
                <ul className="list-disc list-inside text-sm text-foreground space-y-0.5">
                  {report.messaging_analysis.key_claims.map((c: string, i: number) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tech Stack */}
      {report.tech_stack_hints?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {report.tech_stack_hints.map((t: string, i: number) => (
              <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recommendations</h3>
          {report.recommendations.map((rec: any, i: number) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                priorityColors[rec.priority] || "bg-muted text-muted-foreground"
              )}>
                {rec.priority}
              </span>
              <p className="text-sm text-foreground">{rec.action}</p>
            </div>
          ))}
        </div>
      )}

      {/* Risk Assessment */}
      {report.risk_assessment && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Risk Assessment</h3>
          <div className="bg-card border border-border rounded-xl p-6 border-l-4 border-l-warning">
            <p className="text-sm text-foreground">{report.risk_assessment}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- GAP ANALYSIS ---
function GapAnalysisSection({ report }: { report: any }) {
  const gaps = report.gaps || report.market_gaps || [];
  if (gaps.length === 0) return <p className="text-sm text-muted-foreground">No gaps found in this report.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Market Gaps</h3>
      {gaps.map((gap: any, i: number) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
          <ScoreCircle score={gap.opportunity_score || 5} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-foreground">{gap.title}</h4>
              <span className={cn("text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
                categoryColors[gap.category] || "bg-muted text-muted-foreground"
              )}>{gap.category}</span>
            </div>
            <p className="text-xs text-muted-foreground">{gap.description}</p>
            {gap.evidence && <p className="text-xs text-muted-foreground/70 mt-1 italic">Evidence: {gap.evidence}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- STRENGTHS & WEAKNESSES ---
function StrengthsWeaknessesSection({ report }: { report: any }) {
  const strengths = report.strengths || [];
  const weaknesses = report.weaknesses || [];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Strengths</h3>
        {strengths.map((s: any, i: number) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 border-l-4 border-l-primary">
            <p className="text-sm font-semibold text-foreground">{s.title || s}</p>
            {s.detail && <p className="text-xs text-muted-foreground mt-1">{s.detail}</p>}
          </div>
        ))}
        {strengths.length === 0 && <p className="text-xs text-muted-foreground">None identified.</p>}
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Weaknesses</h3>
        {weaknesses.map((w: any, i: number) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 border-l-4 border-l-destructive">
            <p className="text-sm font-semibold text-foreground">{w.title || w}</p>
            {w.detail && <p className="text-xs text-muted-foreground mt-1">{w.detail}</p>}
          </div>
        ))}
        {weaknesses.length === 0 && <p className="text-xs text-muted-foreground">None identified.</p>}
      </div>
    </div>
  );
}

// --- REVIEW SENTIMENT ---
function ReviewSentimentSection({ report }: { report: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{report.overall_sentiment_score ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Sentiment Score</p>
        </div>
        {report.summary && (
          <>
            <div className="h-12 w-px bg-border" />
            <p className="text-sm text-foreground flex-1">{report.summary}</p>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <TagCloud title="Positive Themes" tags={report.positive_themes} color="bg-primary/10 text-primary" />
        <TagCloud title="Negative Themes" tags={report.negative_themes} color="bg-destructive/10 text-destructive" />
        <TagCloud title="Requested Features" tags={report.requested_features} color="bg-accent/10 text-accent" />
      </div>
    </div>
  );
}

function TagCloud({ title, tags, color }: { title: string; tags: any[]; color: string }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag: any, i: number) => (
          <span key={i} className={cn("text-xs px-2 py-0.5 rounded-full", color)}>
            {typeof tag === "string" ? tag : tag.theme || tag.feature || JSON.stringify(tag)}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- EXECUTIVE BRIEFING ---
const threatScoreColor = (score: number) => {
  if (score >= 76) return "text-destructive";
  if (score >= 51) return "text-[hsl(22,100%,60%)]";
  if (score >= 26) return "text-warning";
  return "text-primary";
};

const briefingPriorityColors: Record<string, string> = {
  high: "bg-[hsl(22,100%,60%)]/10 text-[hsl(22,100%,60%)]",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

function ExecutiveBriefingSection({ report }: { report: any }) {
  return (
    <div className="space-y-8">
      {/* Top Threats */}
      {report.top_threats?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Threats</h3>
          {report.top_threats.map((t: any, i: number) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 border-l-4 border-l-destructive">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-sm font-semibold text-foreground">{t.competitor_name}</h4>
                <span className={cn("font-mono text-sm font-bold", threatScoreColor(t.threat_score))}>
                  {t.threat_score}/100
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{t.summary}</p>
            </div>
          ))}
        </div>
      )}

      {/* Key Changes */}
      {report.key_changes?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Changes This Week</h3>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            {report.key_changes.map((c: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{c.competitor_name}</span>
                    <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      {c.change_type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Opportunities */}
      {report.top_opportunities?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Opportunities</h3>
          {report.top_opportunities.map((o: any, i: number) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 border-l-4 border-l-primary">
              <div className="flex items-start gap-4">
                <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 text-primary border-current")}>
                  {o.opportunity_score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{o.title}</h4>
                    <span className="text-xs text-muted-foreground">{o.competitor_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{o.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Actions */}
      {report.recommended_actions?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recommended Actions</h3>
          {report.recommended_actions.map((a: any, i: number) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-sm font-mono font-bold text-muted-foreground w-6">{i + 1}.</span>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
                  briefingPriorityColors[a.priority] || "bg-muted text-muted-foreground"
                )}>
                  {a.priority}
                </span>
                <p className="text-sm font-semibold text-foreground flex-1">{a.action}</p>
              </div>
              <p className="text-xs text-muted-foreground ml-9">{a.reasoning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Market Outlook */}
      {(report.competitive_landscape_summary || report.outlook) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Market Outlook</h3>
          <div className="bg-card border border-border rounded-xl p-6 border-l-4 border-l-[hsl(252,72%,64%)]">
            {report.competitive_landscape_summary && (
              <p className="text-sm text-foreground mb-3">{report.competitive_landscape_summary}</p>
            )}
            {report.outlook && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Next Week</p>
                <p className="text-sm text-foreground">{report.outlook}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
