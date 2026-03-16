import { Link } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const reportTypeBadgeColors: Record<string, string> = {
  gap_analysis: "bg-primary/10 text-primary",
  strengths_weaknesses: "bg-accent/10 text-accent",
  full_intel: "bg-info/10 text-info",
  comparison: "bg-warning-medium/10 text-warning-medium",
  battlecard: "bg-warning/10 text-warning",
  review_sentiment: "bg-destructive/10 text-destructive",
  executive_briefing: "bg-[hsl(240,7%,95%)] text-[hsl(240,10%,4%)]",
};

interface RecentReportsProps {
  reports: Array<{
    id: string;
    title: string;
    report_type: string;
    created_at: string;
    competitors: { name: string } | null;
  }>;
  loading?: boolean;
}

export function RecentReports({ reports, loading }: RecentReportsProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 h-full">
        <div className="h-5 w-32 skeleton-shimmer rounded mb-6" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-4 skeleton-shimmer rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                <div className="h-3 w-1/2 skeleton-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-full transition-all duration-150 hover:border-border-active hover:shadow-card-hover">
      <h3 className="text-base font-semibold text-foreground mb-5">Recent Reports</h3>

      {reports.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/[0.06] flex items-center justify-center mb-3">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No reports yet</p>
          <p className="text-xs text-muted-foreground mb-4">Run your first competitor analysis</p>
          <Button size="sm" asChild>
            <Link to="/competitors">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Run Analysis
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const badgeClass = reportTypeBadgeColors[report.report_type] || "bg-muted text-muted-foreground";
            const typeLabel = report.report_type.replace(/_/g, " ");
            return (
              <div
                key={report.id}
                className="flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{report.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[11px] uppercase tracking-[0.05em] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
                      {typeLabel}
                    </span>
                    {report.competitors && (
                      <span className="text-xs text-muted-foreground">{report.competitors.name}</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5">
                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
