import { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useMarketGaps, useUpdateGapStatus } from "@/hooks/useMarketGaps";
import { useCompetitors } from "@/hooks/useCompetitors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Target, List, LayoutGrid, ChevronDown } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// --- types ---
type Gap = any;
type View = "list" | "kanban";
type ScoreRange = "all" | "high" | "medium" | "low";

const categories = ["all", "feature", "content", "pricing", "positioning", "audience"];
const statuses = ["all", "new", "exploring", "acting_on", "dismissed"];
const statusLabels: Record<string, string> = {
  new: "New",
  exploring: "Exploring",
  acting_on: "Acting On",
  dismissed: "Dismissed",
};
const kanbanCols = ["new", "exploring", "acting_on", "dismissed"];

const categoryColors: Record<string, string> = {
  feature: "bg-primary/10 text-primary",
  content: "bg-accent/10 text-accent",
  pricing: "bg-warning-medium/10 text-warning-medium",
  positioning: "bg-info/10 text-info",
  audience: "bg-destructive/10 text-destructive",
};

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  exploring: "bg-accent/10 text-accent",
  acting_on: "bg-warning-medium/10 text-warning-medium",
  dismissed: "bg-muted text-muted-foreground",
};

function ScoreCircle({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const color = score >= 8 ? "text-primary border-primary" : score >= 5 ? "text-warning-medium border-warning-medium" : "text-muted-foreground border-muted-foreground";
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={cn("rounded-full border-2 flex items-center justify-center font-bold flex-shrink-0", dim, color)}>
      {score}
    </div>
  );
}

export default function MarketGaps() {
  const { data: gaps, isLoading } = useMarketGaps();
  const { data: competitors } = useCompetitors();
  const updateStatus = useUpdateGapStatus();

  const [view, setView] = useState<View>("list");
  const [catFilter, setCatFilter] = useState("all");
  const [scoreRange, setScoreRange] = useState<ScoreRange>("all");
  const [compFilter, setCompFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!gaps) return [];
    let list = [...gaps];
    if (catFilter !== "all") list = list.filter((g) => g.gap_category === catFilter);
    if (compFilter !== "all") list = list.filter((g) => g.competitor_id === compFilter);
    if (statusFilter !== "all") list = list.filter((g) => g.status === statusFilter);
    if (scoreRange === "high") list = list.filter((g) => g.opportunity_score >= 7);
    else if (scoreRange === "medium") list = list.filter((g) => g.opportunity_score >= 4 && g.opportunity_score <= 6);
    else if (scoreRange === "low") list = list.filter((g) => g.opportunity_score <= 3);
    return list;
  }, [gaps, catFilter, scoreRange, compFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!gaps) return { total: 0, avg: 0, high: 0, actingOn: 0 };
    const total = gaps.length;
    const avg = total > 0 ? Math.round(gaps.reduce((s: number, g: any) => s + g.opportunity_score, 0) / total) : 0;
    const high = gaps.filter((g: any) => g.opportunity_score >= 7).length;
    const actingOn = gaps.filter((g: any) => g.status === "acting_on").length;
    return { total, avg, high, actingOn };
  }, [gaps]);

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status });
  };

  const handleDrop = useCallback(
    (status: string) => {
      if (draggedId) {
        updateStatus.mutate({ id: draggedId, status });
        setDraggedId(null);
      }
    },
    [draggedId, updateStatus]
  );

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        {/* Header */}
        <AnimatedItem>
          <h1 className="text-[28px] font-bold text-foreground">Market Gaps</h1>
        </AnimatedItem>

        {/* Filters */}
        <AnimatedItem>
          <div className="space-y-3">
            {/* Category pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full font-medium transition-colors capitalize",
                    catFilter === cat ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>

            {/* Second row */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Score range */}
              <div className="flex gap-1">
                {(["all", "high", "medium", "low"] as ScoreRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setScoreRange(r)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                      scoreRange === r ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r === "all" ? "All Scores" : r === "high" ? "High (7-10)" : r === "medium" ? "Med (4-6)" : "Low (1-3)"}
                  </button>
                ))}
              </div>

              <Select value={compFilter} onValueChange={setCompFilter}>
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s === "all" ? "All Statuses" : statusLabels[s] || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View toggle */}
              <div className="flex ml-auto bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setView("list")}
                  className={cn("p-1.5 rounded-md transition-colors", view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("kanban")}
                  className={cn("p-1.5 rounded-md transition-colors", view === "kanban" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* Summary bar */}
        <AnimatedItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatPill label="Total Gaps" value={stats.total} />
            <StatPill label="Avg Opportunity" value={stats.avg} />
            <StatPill label="High Priority (7+)" value={stats.high} />
            <StatPill label="Acting On" value={stats.actingOn} />
          </div>
        </AnimatedItem>

        {/* Content */}
        <AnimatedItem>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 skeleton-shimmer rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 skeleton-shimmer rounded" />
                    <div className="h-3 w-1/2 skeleton-shimmer rounded" />
                  </div>
                  <div className="h-5 w-16 skeleton-shimmer rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/[0.08] flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">No market gaps found</p>
              <p className="text-xs text-muted-foreground mt-1">Run competitor analyses to discover market opportunities.</p>
            </div>
          ) : view === "list" ? (
            <ListView
              gaps={filtered}
              expandedId={expandedId}
              onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <KanbanView
              gaps={filtered}
              draggedId={draggedId}
              onDragStart={setDraggedId}
              onDrop={handleDrop}
              onStatusChange={handleStatusChange}
            />
          )}
        </AnimatedItem>
      </AnimatedPage>
    </AppLayout>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// --- LIST VIEW ---
function ListView({
  gaps,
  expandedId,
  onToggle,
  onStatusChange,
}: {
  gaps: Gap[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="hidden md:grid grid-cols-[3rem_1fr_6rem_8rem_6rem_6rem] gap-3 px-5 py-2 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
        <span>Score</span>
        <span>Gap</span>
        <span>Category</span>
        <span>Competitor</span>
        <span>Status</span>
        <span>Found</span>
      </div>

      {gaps.map((gap) => {
        const isHot = gap.opportunity_score >= 9;
        return (
          <Collapsible
            key={gap.id}
            open={expandedId === gap.id}
            onOpenChange={() => onToggle(gap.id)}
          >
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  "w-full text-left bg-card border border-border rounded-xl px-5 py-4 transition-all hover:border-border-active",
                  isHot && "border-l-4 border-l-[hsl(22,100%,60%)] bg-[hsl(22,100%,60%)]/[0.02]"
                )}
              >
                <div className="grid grid-cols-1 md:grid-cols-[3rem_1fr_6rem_8rem_6rem_6rem] gap-3 items-center">
                  <ScoreCircle score={gap.opportunity_score} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{gap.gap_title}</p>
                    <p className="text-xs text-muted-foreground truncate md:hidden">
                      {gap.competitors?.name} · {gap.gap_category}
                    </p>
                  </div>
                  <span className={cn("hidden md:inline-block text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full w-fit",
                    categoryColors[gap.gap_category] || "bg-muted text-muted-foreground"
                  )}>
                    {gap.gap_category}
                  </span>
                  <span className="hidden md:block text-xs text-muted-foreground truncate">{gap.competitors?.name}</span>
                  <span className={cn("hidden md:inline-block text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full w-fit",
                    statusColors[gap.status] || "bg-muted text-muted-foreground"
                  )}>
                    {statusLabels[gap.status] || gap.status}
                  </span>
                  <span className="hidden md:block text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(gap.created_at), { addSuffix: true })}
                  </span>
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-card border border-border border-t-0 rounded-b-xl px-5 py-4 -mt-3 space-y-3">
                <p className="text-sm text-foreground">{gap.gap_description}</p>
                {gap.evidence && (
                  <blockquote className="border-l-2 border-border pl-4 text-sm text-muted-foreground italic">
                    {gap.evidence}
                  </blockquote>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Select
                    value={gap.status}
                    onValueChange={(val) => onStatusChange(gap.id, val)}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {kanbanCols.map((s) => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

// --- KANBAN VIEW ---
function KanbanView({
  gaps,
  draggedId,
  onDragStart,
  onDrop,
  onStatusChange,
}: {
  gaps: Gap[];
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDrop: (status: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kanbanCols.map((col) => {
        const colGaps = gaps.filter((g) => g.status === col);
        return (
          <div
            key={col}
            className="bg-muted/30 rounded-xl p-3 min-h-[200px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col)}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-foreground">{statusLabels[col]}</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {colGaps.length}
              </span>
            </div>
            <div className="space-y-2">
              {colGaps.map((gap) => {
                const isHighNew = col === "new" && gap.opportunity_score >= 8;
                return (
                  <div
                    key={gap.id}
                    draggable
                    onDragStart={() => onDragStart(gap.id)}
                    className={cn(
                      "bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm",
                      isHighNew && "border-primary/50 animate-pulse [animation-duration:3s]"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <ScoreCircle score={gap.opportunity_score} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground line-clamp-2">{gap.gap_title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{gap.competitors?.name}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={cn("text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full",
                        categoryColors[gap.gap_category] || "bg-muted text-muted-foreground"
                      )}>
                        {gap.gap_category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
