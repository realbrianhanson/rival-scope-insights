import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useReports } from "@/hooks/useReports";
import { useCompetitors } from "@/hooks/useCompetitors";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { EmptyStateWrapper } from "@/components/empty-states/EmptyStateWrapper";
import { DocumentDrawIllustration } from "@/components/empty-states/DocumentDrawIllustration";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  FileText,
  Loader2,
  CheckCircle2,
  Circle,
  Search,
  Brain,
  Database,
} from "lucide-react";

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

const analysisTypes = [
  { value: "full_intel", label: "Full Intelligence Report" },
  { value: "gap_analysis", label: "Gap Analysis" },
  { value: "strengths_weaknesses", label: "Strengths & Weaknesses" },
  { value: "review_sentiment", label: "Review Sentiment Analysis" },
];

const progressSteps = [
  { label: "Gathering data", icon: Database },
  { label: "Analyzing content", icon: Brain },
  { label: "Building report", icon: FileText },
];

export default function Reports() {
  useDocumentTitle("Reports");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: competitors } = useCompetitors();

  const [competitorFilter, setCompetitorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [genType, setGenType] = useState("full_intel");
  const [genCompetitor, setGenCompetitor] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);

  const { data: reports, isLoading, refetch } = useReports({
    competitorId: competitorFilter,
    reportType: typeFilter,
    dateRange: dateFilter,
  });

  const activeCompetitors = useMemo(
    () => (competitors || []).filter((c) => c.status === "active"),
    [competitors]
  );

  const handleGenerate = async () => {
    if (!user || !genCompetitor) {
      toast.error("Please select a competitor");
      return;
    }
    setGenerating(true);
    setGenStep(0);

    try {
      // Step 1: Gathering
      await new Promise((r) => setTimeout(r, 800));
      setGenStep(1);

      // Step 2: Analyzing
      const { data, error } = await supabase.functions.invoke("analyze-competitor", {
        body: {
          competitor_id: genCompetitor,
          user_id: user.id,
          analysis_type: genType,
        },
      });

      setGenStep(2);
      await new Promise((r) => setTimeout(r, 500));

      if (error) throw new Error(error.message);
      if (!data?.success && !data?.partial) throw new Error(data?.error || "Failed to generate report");

      toast.success("Report generated!");
      setModalOpen(false);
      refetch();

      if (data?.report_id) {
        navigate(`/reports/${data.report_id}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setGenerating(false);
    setGenStep(0);
  };

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        {/* Header */}
        <AnimatedItem>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-[28px] font-bold text-foreground">Reports</h1>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </AnimatedItem>

        {/* Filters */}
        <AnimatedItem>
          <div className="flex flex-wrap gap-3">
            <Select value={competitorFilter} onValueChange={setCompetitorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Competitor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Competitors</SelectItem>
                {(competitors || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {analysisTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
                <SelectItem value="executive_briefing">Executive Briefing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AnimatedItem>

        {/* Report list */}
        <AnimatedItem>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-1/3 skeleton-shimmer rounded" />
                    <div className="h-5 w-20 skeleton-shimmer rounded-full" />
                  </div>
                  <div className="h-3 w-2/3 skeleton-shimmer rounded" />
                  <div className="h-3 w-1/2 skeleton-shimmer rounded" />
                </div>
              ))}
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/[0.08] flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">No reports yet</p>
              <p className="text-xs text-muted-foreground mt-1">Generate your first intelligence report.</p>
              <Button size="sm" className="mt-4" onClick={() => setModalOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report: any) => (
                <button
                  key={report.id}
                  onClick={() => navigate(`/reports/${report.id}`)}
                  className="w-full text-left bg-card border border-border rounded-xl p-5 transition-all hover:border-border-active hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-semibold text-foreground truncate">{report.title}</h3>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                          reportTypeColors[report.report_type] || "bg-muted text-muted-foreground"
                        )}>
                          {reportTypeLabels[report.report_type] || report.report_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span>{report.competitors?.name || "Multi-competitor"}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted">
                          {report.ai_model_used}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{report.summary}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AnimatedItem>
      </AnimatedPage>

      {/* Generate Report Modal */}
      <Dialog open={modalOpen} onOpenChange={generating ? undefined : setModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Generate Report</DialogTitle>
          </DialogHeader>

          {generating ? (
            <div className="py-8 space-y-6">
              {progressSteps.map((step, i) => {
                const StepIcon = step.icon;
                const status = i < genStep ? "done" : i === genStep ? "active" : "pending";
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                      status === "done" ? "bg-primary/10" :
                      status === "active" ? "bg-primary/10 animate-pulse" :
                      "bg-muted"
                    )}>
                      {status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : status === "active" ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      status === "done" ? "text-primary" :
                      status === "active" ? "text-foreground" :
                      "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Report Type</label>
                <Select value={genType} onValueChange={setGenType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {analysisTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Competitor</label>
                <Select value={genCompetitor} onValueChange={setGenCompetitor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a competitor" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCompetitors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={handleGenerate} disabled={!genCompetitor}>
                  Generate
                </Button>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
