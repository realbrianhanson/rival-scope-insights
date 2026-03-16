import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useComparisons } from "@/hooks/useComparisons";
import { useCompetitors } from "@/hooks/useCompetitors";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, GitCompareArrows } from "lucide-react";
import { AnalysisProgress, STEP_CONFIGS } from "@/components/AnalysisProgress";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { EmptyStateWrapper } from "@/components/empty-states/EmptyStateWrapper";
import { ComparisonBarsIllustration } from "@/components/empty-states/ComparisonBarsIllustration";

export default function Comparisons() {
  useDocumentTitle("Comparisons");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: comparisons, isLoading, refetch } = useComparisons();
  const { data: competitors } = useCompetitors();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const activeComps = useMemo(
    () => (competitors || []).filter((c) => c.status === "active"),
    [competitors]
  );

  const toggleCompetitor = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const handleGenerate = async () => {
    if (!user || selectedIds.length < 2) {
      toast.error("Select at least 2 competitors");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-comparison", {
        body: {
          competitor_ids: selectedIds,
          user_id: user.id,
          title: title.trim() || undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed");
      toast.success("Comparison generated!");
      setModalOpen(false);
      setTitle("");
      setSelectedIds([]);
      refetch();
      if (data.matrix_id) navigate(`/comparisons/${data.matrix_id}`);
    } catch (e: any) {
      toast.error(e.message);
    }
    setGenerating(false);
  };

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        <AnimatedItem>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[28px] font-bold text-foreground">Comparisons</h1>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Comparison
            </Button>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-3">
                  <div className="h-5 w-1/2 skeleton-shimmer rounded" />
                  <div className="h-3 w-1/3 skeleton-shimmer rounded" />
                </div>
              ))}
            </div>
          ) : !comparisons || comparisons.length === 0 ? (
            <EmptyStateWrapper
              illustration={<ComparisonBarsIllustration />}
              heading="No comparisons created"
              subtext="Select two or more competitors to generate a side-by-side feature matrix."
              ctaLabel="New Comparison"
              onCta={() => setModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {comparisons.map((cm: any) => (
                <button
                  key={cm.id}
                  onClick={() => navigate(`/comparisons/${cm.id}`)}
                  className="w-full text-left bg-card border border-border rounded-xl p-5 transition-all hover:border-border-active hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-foreground truncate">{cm.title}</h3>
                      {cm.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{cm.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        {cm.competitor_ids?.length || 0} competitors
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(cm.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AnimatedItem>
      </AnimatedPage>

      {/* New Comparison Modal */}
      <Dialog open={modalOpen} onOpenChange={generating ? undefined : setModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">New Comparison</DialogTitle>
          </DialogHeader>

          {generating ? (
            <div className="py-10 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm font-medium text-foreground">
                Analyzing {selectedIds.length} competitors...
              </p>
              <p className="text-xs text-muted-foreground">This may take a moment.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Title <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="AI will generate one if left blank"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Competitors{" "}
                  <span className="text-muted-foreground font-normal">(2–5)</span>
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activeComps.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No active competitors. Add competitors first.
                    </p>
                  ) : (
                    activeComps.map((c) => (
                      <label
                        key={c.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer transition-colors",
                          selectedIds.includes(c.id)
                            ? "bg-primary/[0.04] border-primary/30"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={selectedIds.includes(c.id)}
                          onCheckedChange={() => toggleCompetitor(c.id)}
                          disabled={!selectedIds.includes(c.id) && selectedIds.length >= 5}
                        />
                        <span className="text-sm font-medium text-foreground flex-1 truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {c.status}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={handleGenerate} disabled={selectedIds.length < 2}>
                  Generate Comparison
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
