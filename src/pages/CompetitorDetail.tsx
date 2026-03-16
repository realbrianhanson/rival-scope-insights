import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useCompetitorDetail } from "@/hooks/useCompetitorDetail";
import { useScanCompetitor } from "@/hooks/useScanCompetitor";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Play,
  Shield,
  FileText,
  GitCompareArrows,
  ExternalLink,
  Loader2,
  Brain,
  ChevronDown,
  TrendingUp,
  Target,
  AlertTriangle,
  Zap,
  BarChart3,
  MessageSquare,
  Code,
  Clock,
  Database,
  Compass,
  Plus,
  X,
} from "lucide-react";
import { ThreatScoreBadge, ThreatTrendIcon } from "@/components/dashboard/ThreatRadar";
import { useCompetitorSuggestionsByCompetitor, useDismissSuggestion, useAcceptSuggestion } from "@/hooks/useCompetitorSuggestions";
import { AddCompetitorModal } from "@/components/competitors/AddCompetitorModal";

// --- Skeleton ---
function TabSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="h-4 w-1/3 skeleton-shimmer rounded" />
          <div className="h-3 w-2/3 skeleton-shimmer rounded" />
          <div className="h-3 w-1/2 skeleton-shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

// --- Stat card ---
function StatBox({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/[0.08] flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// --- Category badge ---
const categoryColors: Record<string, string> = {
  feature: "bg-primary/10 text-primary",
  content: "bg-accent/10 text-accent",
  pricing: "bg-warning-medium/10 text-warning-medium",
  positioning: "bg-info/10 text-info",
  audience: "bg-destructive/10 text-destructive",
};

// --- Score circle ---
function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 8 ? "text-primary" : score >= 5 ? "text-warning-medium" : "text-muted-foreground";
  return (
    <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0", color, `border-current`)}>
      {score}
    </div>
  );
}

// --- Status badge ---
const jobStatusStyles: Record<string, string> = {
  completed: "bg-primary/10 text-primary",
  running: "bg-warning-medium/10 text-warning-medium",
  failed: "bg-destructive/10 text-destructive",
  pending: "bg-muted text-muted-foreground",
};

export default function CompetitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startScan, getPhase } = useScanCompetitor();
  const phase = getPhase(id || "");
  const [generatingBattlecard, setGeneratingBattlecard] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [gapFilter, setGapFilter] = useState<string>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ name: string; url: string } | null>(null);

  const {
    competitor,
    latestReport,
    allReports,
    marketGaps,
    reviewAnalyses,
    scrapeJobs,
    scrapeResults,
    latestSnapshot,
  } = useCompetitorDetail(id);

  const comp = competitor.data;
  useDocumentTitle(comp?.name ? `${comp.name}` : "Competitor");
  const report = latestReport.data;
  const fullReport = report?.full_report as any;

  const handleGenerateBattlecard = async () => {
    if (!user || !id) return;
    setGeneratingBattlecard(true);
    toast.info("Generating battlecard...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-battlecard", {
        body: { competitor_id: id, user_id: user.id },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed");
      toast.success("Battlecard generated!");
    } catch (e: any) {
      toast.error(e.message);
    }
    setGeneratingBattlecard(false);
  };

  const handleGenerateReport = async () => {
    if (!user || !id) return;
    setGeneratingReport(true);
    toast.info("Generating report...");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-competitor", {
        body: { competitor_id: id, user_id: user.id, analysis_type: "full_intel" },
      });
      if (error) throw new Error(error.message);
      if (!data?.success && !data?.partial) throw new Error(data?.error || "Failed");
      toast.success("Report generated!");
      latestReport.refetch();
      allReports.refetch();
      marketGaps.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
    setGeneratingReport(false);
  };

  if (competitor.isLoading) {
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

  if (!comp) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Competitor not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/competitors")}>
            Back to Competitors
          </Button>
        </div>
      </AppLayout>
    );
  }

  const strengths = fullReport?.strengths || [];
  const weaknesses = fullReport?.weaknesses || [];
  const gaps = marketGaps.data || [];
  const filteredGaps = gapFilter === "all" ? gaps : gaps.filter((g: any) => g.gap_category === gapFilter);
  const gapCategories = [...new Set(gaps.map((g: any) => g.gap_category))];
  const techStack = (latestSnapshot.data?.tech_stack as any)?.detected || fullReport?.tech_stack_hints || [];
  const avgScore = gaps.length > 0 ? Math.round(gaps.reduce((s: number, g: any) => s + g.opportunity_score, 0) / gaps.length) : 0;

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        {/* Header */}
        <AnimatedItem>
          <button
            onClick={() => navigate("/competitors")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Competitors
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-[28px] font-bold text-foreground">{comp.name}</h1>
                <ThreatScoreBadge score={(comp as any).threat_score ?? null} level={(comp as any).threat_level ?? null} size="lg" />
                <span className={cn(
                  "text-[11px] uppercase tracking-[0.05em] font-medium px-3 py-1 rounded-full",
                  comp.status === "active" ? "bg-primary/10 text-primary"
                    : comp.status === "paused" ? "bg-warning-medium/10 text-warning-medium"
                    : "bg-muted text-muted-foreground"
                )}>
                  {comp.status}
                </span>
                {comp.industry && (
                  <span className="text-[11px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                    {comp.industry}
                  </span>
                )}
              </div>
              <a
                href={comp.website_url.startsWith("http") ? comp.website_url : `https://${comp.website_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
              >
                {comp.website_url.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => user && startScan(id!, comp.name, "full_site", user.id)}
                disabled={phase !== "idle"}
              >
                {phase === "scanning" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  : phase === "analyzing" ? <Brain className="mr-1.5 h-4 w-4 animate-pulse" />
                  : <Play className="mr-1.5 h-4 w-4" />}
                {phase === "scanning" ? "Scanning..." : phase === "analyzing" ? "Analyzing..." : "Run Full Scan"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleGenerateBattlecard} disabled={generatingBattlecard}>
                {generatingBattlecard ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Shield className="mr-1.5 h-4 w-4" />}
                Generate Battlecard
              </Button>
              <Button size="sm" variant="outline" onClick={handleGenerateReport} disabled={generatingReport}>
                {generatingReport ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileText className="mr-1.5 h-4 w-4" />}
                Generate Report
              </Button>
            </div>
          </div>
        </AnimatedItem>

        {/* Tabs */}
        <AnimatedItem>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-card border border-border p-1 h-auto flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="strengths">Strengths & Weaknesses</TabsTrigger>
              <TabsTrigger value="gaps">Market Gaps</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Intel</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="content">Content Analysis</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview">
              {latestReport.isLoading ? <TabSkeleton /> : !report ? (
                <EmptyTab message="No analysis data yet." action="Run a full scan to generate intelligence." />
              ) : (
                <div className="space-y-6">
                  {fullReport?.executive_summary && (
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Executive Summary</h3>
                      <p className="text-sm text-foreground leading-relaxed">{fullReport.executive_summary}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Strengths" value={strengths.length} icon={TrendingUp} />
                    <StatBox label="Weaknesses" value={weaknesses.length} icon={AlertTriangle} />
                    <StatBox label="Market Gaps" value={gaps.length} icon={Target} />
                    <StatBox label="Avg Opportunity" value={avgScore} icon={Zap} />
                  </div>
                  {/* Threat Assessment */}
                  {(comp as any).threat_score != null && (
                    <div className="bg-card border border-border rounded-xl p-6 border-l-4 border-l-warning">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Threat Assessment</h3>
                      <div className="flex items-center gap-4 flex-wrap">
                        <ThreatScoreBadge score={(comp as any).threat_score} level={(comp as any).threat_level} size="lg" />
                        {latestSnapshot.data && (latestSnapshot.data as any).threat_trend && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <ThreatTrendIcon trend={(latestSnapshot.data as any).threat_trend} />
                            <span className="capitalize">{(latestSnapshot.data as any).threat_trend}</span>
                          </div>
                        )}
                      </div>
                      {latestSnapshot.data && (latestSnapshot.data as any).threat_reason && (
                        <p className="text-sm text-foreground mt-3">{(latestSnapshot.data as any).threat_reason}</p>
                      )}
                    </div>
                  )}
                  {techStack.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Detected Tech Stack</h3>
                      <div className="flex flex-wrap gap-2">
                        {techStack.map((t: string, i: number) => (
                          <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* STRENGTHS & WEAKNESSES */}
            <TabsContent value="strengths">
              {latestReport.isLoading ? <TabSkeleton /> : strengths.length === 0 && weaknesses.length === 0 ? (
                <EmptyTab message="No strengths & weaknesses data." action="Run a full analysis first." />
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Strengths</h3>
                    {strengths.map((s: any, i: number) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-4 border-l-4 border-l-primary">
                        <p className="text-sm font-semibold text-foreground">{s.title || s}</p>
                        {s.detail && <p className="text-xs text-muted-foreground mt-1">{s.detail}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Weaknesses</h3>
                    {weaknesses.map((w: any, i: number) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-4 border-l-4 border-l-destructive">
                        <p className="text-sm font-semibold text-foreground">{w.title || w}</p>
                        {w.detail && <p className="text-xs text-muted-foreground mt-1">{w.detail}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* MARKET GAPS */}
            <TabsContent value="gaps">
              {marketGaps.isLoading ? <TabSkeleton /> : gaps.length === 0 ? (
                <EmptyTab message="No market gaps identified yet." action="Run a full analysis to discover opportunities." />
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setGapFilter("all")}
                      className={cn("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                        gapFilter === "all" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >All ({gaps.length})</button>
                    {gapCategories.map((cat: any) => (
                      <button
                        key={cat}
                        onClick={() => setGapFilter(cat)}
                        className={cn("text-xs px-3 py-1.5 rounded-full font-medium transition-colors capitalize",
                          gapFilter === cat ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >{cat} ({gaps.filter((g: any) => g.gap_category === cat).length})</button>
                    ))}
                  </div>
                  {filteredGaps.map((gap: any) => (
                    <div key={gap.id} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <ScoreCircle score={gap.opportunity_score} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground">{gap.gap_title}</h4>
                            <span className={cn("text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
                              categoryColors[gap.gap_category] || "bg-muted text-muted-foreground"
                            )}>{gap.gap_category}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{gap.gap_description}</p>
                          {gap.evidence && (
                            <Accordion type="single" collapsible className="mt-2">
                              <AccordionItem value="evidence" className="border-none">
                                <AccordionTrigger className="text-xs text-muted-foreground py-1 hover:no-underline">Evidence</AccordionTrigger>
                                <AccordionContent className="text-xs text-muted-foreground">{gap.evidence}</AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* PRICING */}
            <TabsContent value="pricing">
              {latestReport.isLoading ? <TabSkeleton /> : !fullReport?.pricing_analysis ? (
                <EmptyTab message="No pricing intelligence available." action="Run a pricing scrape to gather pricing data." />
              ) : (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pricing Summary</h3>
                    <p className="text-sm text-foreground">{fullReport.pricing_analysis.summary}</p>
                  </div>
                  {fullReport.pricing_analysis.strategy && (
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Strategy</h3>
                      <p className="text-sm text-foreground">{fullReport.pricing_analysis.strategy}</p>
                    </div>
                  )}
                  {fullReport.pricing_analysis.tiers && fullReport.pricing_analysis.tiers.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pricing Tiers</h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fullReport.pricing_analysis.tiers.map((tier: any, i: number) => (
                          <div key={i} className="p-4 rounded-lg border border-border bg-muted/30">
                            <p className="text-sm font-semibold text-foreground">{tier.name || tier.tier || `Tier ${i + 1}`}</p>
                            {tier.price && <p className="text-lg font-bold text-primary mt-1">{tier.price}</p>}
                            {tier.description && <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* REVIEWS */}
            <TabsContent value="reviews">
              {reviewAnalyses.isLoading ? <TabSkeleton /> : !reviewAnalyses.data || reviewAnalyses.data.length === 0 ? (
                <EmptyTab message="No review analysis data." action="Scrape review sources to analyze sentiment." />
              ) : (
                <div className="space-y-6">
                  {reviewAnalyses.data.map((ra: any) => (
                    <div key={ra.id} className="space-y-4">
                      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-primary">{ra.overall_sentiment_score}</p>
                          <p className="text-xs text-muted-foreground mt-1">Sentiment Score</p>
                        </div>
                        <div className="h-12 w-px bg-border" />
                        <div>
                          <p className="text-xs text-muted-foreground">Source: <span className="font-medium text-foreground">{ra.source}</span></p>
                          {ra.review_count && <p className="text-xs text-muted-foreground">Reviews analyzed: {ra.review_count}</p>}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <TagSection title="Positive Themes" tags={ra.positive_themes} color="bg-primary/10 text-primary" />
                        <TagSection title="Negative Themes" tags={ra.negative_themes} color="bg-destructive/10 text-destructive" />
                        <TagSection title="Requested Features" tags={ra.requested_features} color="bg-accent/10 text-accent" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* CONTENT */}
            <TabsContent value="content">
              {latestReport.isLoading ? <TabSkeleton /> : !fullReport?.content_strategy ? (
                <EmptyTab message="No content analysis available." action="Run a blog scrape to analyze content strategy." />
              ) : (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Content Summary</h3>
                    <p className="text-sm text-foreground">{fullReport.content_strategy.summary}</p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {fullReport.content_strategy.frequency && (
                      <div className="bg-card border border-border rounded-xl p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Frequency</p>
                        <p className="text-sm font-medium text-foreground">{fullReport.content_strategy.frequency}</p>
                      </div>
                    )}
                    {fullReport.content_strategy.quality_assessment && (
                      <div className="bg-card border border-border rounded-xl p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Quality</p>
                        <p className="text-sm font-medium text-foreground">{fullReport.content_strategy.quality_assessment}</p>
                      </div>
                    )}
                  </div>
                  {fullReport.content_strategy.themes?.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Themes</h3>
                      <div className="flex flex-wrap gap-2">
                        {fullReport.content_strategy.themes.map((t: string, i: number) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 text-accent">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* HISTORY */}
            <TabsContent value="history">
              {scrapeJobs.isLoading ? <TabSkeleton /> : (
                <div className="space-y-3">
                  {[
                    ...(scrapeJobs.data || []).map((j: any) => ({ type: "scrape", date: j.started_at, data: j })),
                    ...(allReports.data || []).map((r: any) => ({ type: "report", date: r.created_at, data: r })),
                  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((item, i) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {item.type === "scrape" ? <Database className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.type === "scrape" ? `${item.data.job_type} scrape` : item.data.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.date), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <span className={cn("text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
                          jobStatusStyles[item.data.status] || "bg-muted text-muted-foreground"
                        )}>
                          {item.data.status || item.data.report_type}
                        </span>
                        {item.type === "scrape" && item.data.pages_scraped > 0 && (
                          <span className="text-xs text-muted-foreground">{item.data.pages_scraped} pages</span>
                        )}
                      </div>
                    ))}
                  {(scrapeJobs.data?.length || 0) + (allReports.data?.length || 0) === 0 && (
                    <EmptyTab message="No history yet." action="Run a scan to get started." />
                  )}
                </div>
              )}
            </TabsContent>

            {/* RAW DATA */}
            <TabsContent value="raw">
              {scrapeResults.isLoading ? <TabSkeleton /> : !scrapeResults.data || scrapeResults.data.length === 0 ? (
                <EmptyTab message="No scraped data available." action="Run a scan to collect data." />
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {scrapeResults.data.map((r: any) => (
                    <AccordionItem key={r.id} value={r.id} className="bg-card border border-border rounded-xl px-5">
                      <AccordionTrigger className="py-4 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <span className={cn("text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground")}>
                            {r.page_type}
                          </span>
                          <span className="text-sm font-mono text-foreground truncate max-w-md">{r.page_url}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg">
                          {r.raw_content?.slice(0, 5000) || "No content"}
                          {r.raw_content?.length > 5000 && "\n\n... (truncated)"}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
          </Tabs>
        </AnimatedItem>
      </AnimatedPage>
    </AppLayout>
  );
}

// --- Helpers ---
function EmptyTab({ message, action }: { message: string; action: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-12 text-center">
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">{action}</p>
    </div>
  );
}

function TagSection({ title, tags, color }: { title: string; tags: any[]; color: string }) {
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
