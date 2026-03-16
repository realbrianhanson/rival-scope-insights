import { TrendingUp } from "lucide-react";

const scoreColor = (score: number) => {
  if (score >= 9) return "#FF6B35";
  if (score >= 7) return "hsl(var(--primary))";
  if (score >= 4) return "#FFBE0B";
  return "hsl(var(--muted-foreground))";
};

const categoryBadgeColors: Record<string, string> = {
  feature: "bg-primary/10 text-primary",
  content: "bg-accent/10 text-accent",
  pricing: "bg-warning/10 text-warning",
  positioning: "bg-info/10 text-info",
  audience: "bg-warning-medium/10 text-warning-medium",
};

interface TopOpportunitiesProps {
  opportunities: Array<{
    id: string;
    gap_title: string;
    gap_category: string;
    opportunity_score: number;
    competitors: { name: string } | null;
  }>;
  loading?: boolean;
}

export function TopOpportunities({ opportunities, loading }: TopOpportunitiesProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 h-full">
        <div className="h-5 w-36 skeleton-shimmer rounded mb-6" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 skeleton-shimmer rounded-full" />
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
      <h3 className="text-base font-semibold text-foreground mb-5">Top Opportunities</h3>

      {opportunities.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/[0.06] flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No gaps discovered</p>
          <p className="text-xs text-muted-foreground">Run analysis to find market opportunities</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((gap) => {
            const color = scoreColor(gap.opportunity_score);
            const badgeClass = categoryBadgeColors[gap.gap_category] || "bg-muted text-muted-foreground";
            return (
              <div
                key={gap.id}
                className="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                {/* Score circle */}
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {gap.opportunity_score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{gap.gap_title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[11px] uppercase tracking-[0.05em] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
                      {gap.gap_category}
                    </span>
                    {gap.competitors && (
                      <span className="text-xs text-muted-foreground">{gap.competitors.name}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
