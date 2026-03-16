import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useCompetitors, useLastAnalyzedMap } from "@/hooks/useCompetitors";
import { CompetitorCard } from "@/components/competitors/CompetitorCard";
import { AddCompetitorModal } from "@/components/competitors/AddCompetitorModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScanCompetitor } from "@/hooks/useScanCompetitor";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAppSettings } from "@/hooks/useAppSettings";
import { EmptyStateWrapper } from "@/components/empty-states/EmptyStateWrapper";
import { CrosshairIllustration } from "@/components/empty-states/CrosshairIllustration";

type FilterTab = "all" | "active" | "paused" | "archived";

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "archived", label: "Archived" },
];

export default function Competitors() {
  const { user } = useAuth();
  const { data: appSettings } = useAppSettings();
  const appName = appSettings?.app_name || "RivalScope";
  useDocumentTitle("Competitors");
  const { data: competitors, isLoading } = useCompetitors();
  const { data: lastAnalyzedMap } = useLastAnalyzedMap();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const { startScan, getPhase } = useScanCompetitor();

  const counts = useMemo(() => {
    if (!competitors) return { all: 0, active: 0, paused: 0, archived: 0 };
    return {
      all: competitors.length,
      active: competitors.filter((c) => c.status === "active").length,
      paused: competitors.filter((c) => c.status === "paused").length,
      archived: competitors.filter((c) => c.status === "archived").length,
    };
  }, [competitors]);

  const [sortByThreat, setSortByThreat] = useState(false);

  const filtered = useMemo(() => {
    if (!competitors) return [];
    let list = competitors;
    if (activeTab !== "all") list = list.filter((c) => c.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.website_url.toLowerCase().includes(q)
      );
    }
    if (sortByThreat) {
      list = [...list].sort((a, b) => ((b as any).threat_score ?? -1) - ((a as any).threat_score ?? -1));
    }
    return list;
  }, [competitors, activeTab, search, sortByThreat]);

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        <AnimatedItem>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-[28px] font-bold text-foreground">Competitors</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or URL..."
                  className="pl-9 w-[220px]"
                />
              </div>
              <button
                onClick={() => setSortByThreat(!sortByThreat)}
                className={cn(
                  "text-xs font-medium px-3 py-2 rounded-lg border transition-colors",
                  sortByThreat
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                Sort by Threat
              </button>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Competitor
              </Button>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="flex gap-1 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors relative",
                  activeTab === tab.key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "ml-1.5 text-[11px] font-mono px-1.5 py-0.5 rounded-full",
                    activeTab === tab.key
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {counts[tab.key]}
                </span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </AnimatedItem>

        <AnimatedItem>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 flex flex-col">
                  {/* Threat badge placeholder top-right */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-[18px] w-3/5 skeleton-shimmer rounded" />
                      <div className="h-3 w-2/5 skeleton-shimmer rounded" />
                    </div>
                    <div className="h-6 w-10 skeleton-shimmer rounded-full" />
                  </div>
                  {/* Description */}
                  <div className="h-3 w-full skeleton-shimmer rounded mb-1" />
                  <div className="h-3 w-4/5 skeleton-shimmer rounded mb-3" />
                  {/* Meta row */}
                  <div className="flex items-center gap-3 pt-3 mt-auto border-t border-border">
                    <div className="h-3 w-28 skeleton-shimmer rounded" />
                  </div>
                  {/* Actions row */}
                  <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border">
                    <div className="h-8 w-8 skeleton-shimmer rounded-lg" />
                    <div className="h-8 w-8 skeleton-shimmer rounded-lg" />
                    <div className="h-8 w-8 skeleton-shimmer rounded-lg" />
                    <div className="h-8 w-8 skeleton-shimmer rounded-lg ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : competitors && competitors.length === 0 ? (
            <EmptyStateWrapper
              illustration={<CrosshairIllustration />}
              heading="No competitors in your sights"
              subtext={`Add a competitor's website and ${appName} will scrape, analyze, and monitor them for you.`}
              ctaLabel="Add Your First Competitor"
              onCta={() => setModalOpen(true)}
            />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">No competitors match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => (
                <CompetitorCard
                  key={c.id}
                  competitor={c}
                  lastAnalyzed={lastAnalyzedMap?.[c.id]}
                  scanPhase={getPhase(c.id)}
                  onScan={(jobType) =>
                    user && startScan(c.id, c.name, jobType, user.id)
                  }
                />
              ))}
            </div>
          )}
        </AnimatedItem>
      </AnimatedPage>
      <AddCompetitorModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppLayout>
  );
}
