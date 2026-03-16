import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useCompetitors, useLastAnalyzedMap } from "@/hooks/useCompetitors";
import { CompetitorCard } from "@/components/competitors/CompetitorCard";
import { AddCompetitorModal } from "@/components/competitors/AddCompetitorModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScanCompetitor } from "@/hooks/useScanCompetitor";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAppSettings } from "@/hooks/useAppSettings";

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
    return list;
  }, [competitors, activeTab, search]);

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
                <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                      <div className="h-3 w-1/2 skeleton-shimmer rounded" />
                    </div>
                    <div className="h-5 w-14 skeleton-shimmer rounded-full" />
                  </div>
                  <div className="h-3 w-full skeleton-shimmer rounded" />
                  <div className="h-8 w-full skeleton-shimmer rounded mt-4" />
                </div>
              ))}
            </div>
          ) : competitors && competitors.length === 0 ? (
            <div className="relative bg-card border border-border rounded-2xl p-12 text-center overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03]">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="comp-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#comp-grid)" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.04),transparent_70%)]" />
              <div className="relative z-10 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/[0.08] flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Track your first competitor</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Add a competitor's website and {appName} will scrape, analyze, and monitor them for you.
                </p>
                <Button onClick={() => setModalOpen(true)} className="mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Competitor
                </Button>
              </div>
            </div>
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
