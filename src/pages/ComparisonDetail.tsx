import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useComparisonDetail } from "@/hooks/useComparisons";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { format } from "date-fns";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  Check,
  X,
  Minus,
  HelpCircle,
  Share2,
} from "lucide-react";
import { ShareLinkModal } from "@/components/ShareLinkModal";

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "yes":
      return (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      );
    case "no":
      return (
        <div className="w-7 h-7 rounded-full bg-destructive flex items-center justify-center">
          <X className="h-3.5 w-3.5 text-destructive-foreground" />
        </div>
      );
    case "partial":
      return (
        <div className="w-7 h-7 rounded-full bg-warning-medium flex items-center justify-center">
          <Minus className="h-3.5 w-3.5 text-warning-foreground" />
        </div>
      );
    default:
      return (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      );
  }
}

export default function ComparisonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: matrix, isLoading, refetch } = useComparisonDetail(id);
  const [regenerating, setRegenerating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  useDocumentTitle(matrix?.title || "Comparison");

  const handleRegenerate = async () => {
    if (!user || !matrix) return;
    setRegenerating(true);
    toast.info("Regenerating comparison...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-comparison", {
        body: {
          competitor_ids: matrix.competitor_ids,
          user_id: user.id,
          title: matrix.title,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed");
      toast.success("Comparison regenerated!");
      if (data.matrix_id) {
        navigate(`/comparisons/${data.matrix_id}`, { replace: true });
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
          <div className="h-8 w-64 skeleton-shimmer rounded" />
          <div className="h-4 w-48 skeleton-shimmer rounded" />
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 skeleton-shimmer rounded" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!matrix) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Comparison not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/comparisons")}>
            Back to Comparisons
          </Button>
        </div>
      </AppLayout>
    );
  }

  const categories = (matrix.categories as any[]) || [];
  const matrixData = matrix.matrix_data as any;
  const advantages: string[] = matrixData?.your_advantages || [];
  const summary: string = matrixData?.summary || matrix.description || "";

  // Extract competitor names from the first feature's values keys
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
    <AppLayout>
      <AnimatedPage className="space-y-6">
        {/* Back */}
        <AnimatedItem>
          <button
            onClick={() => navigate("/comparisons")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Comparisons
          </button>
        </AnimatedItem>

        {/* Header */}
        <AnimatedItem>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold text-foreground">{matrix.title}</h1>
              {matrix.description && (
                <p className="text-sm text-muted-foreground mt-1">{matrix.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Generated {format(new Date(matrix.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
                <Share2 className="mr-1.5 h-4 w-4" />
                Share
              </Button>
              <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                )}
                Regenerate
              </Button>
            </div>
          </div>
        </AnimatedItem>

        {/* Matrix Table */}
        <AnimatedItem>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                {/* Column headers */}
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4 w-[200px] min-w-[200px]">
                      Feature
                    </th>
                    {competitorNames.map((name, ci) => (
                      <th
                        key={name}
                        className={cn(
                          "text-center text-xs font-semibold text-foreground uppercase tracking-wider px-4 py-4 min-w-[140px]",
                          ci % 2 === 1 && "bg-foreground/[0.01]"
                        )}
                      >
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat: any, catIdx: number) => (
                    <>
                      {/* Category header */}
                      <tr key={`cat-${catIdx}`}>
                        <td
                          colSpan={competitorNames.length + 1}
                          className="bg-foreground/[0.03] dark:bg-foreground/[0.06] px-5 py-2.5 text-[11px] font-bold text-foreground uppercase tracking-[0.08em]"
                        >
                          {cat.name}
                        </td>
                      </tr>

                      {/* Feature rows */}
                      {(cat.features || []).map((feat: any, fi: number) => (
                        <tr
                          key={`${catIdx}-${fi}`}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-5 py-3 text-sm font-medium text-foreground">
                            {feat.name}
                          </td>
                          {competitorNames.map((name, ci) => {
                            const val = feat.values?.[name];
                            const status = val?.status || "unknown";
                            const detail = val?.detail || "";
                            return (
                              <td
                                key={name}
                                className={cn(
                                  "px-4 py-3 text-center",
                                  ci % 2 === 1 && "bg-foreground/[0.01]"
                                )}
                              >
                                <div className="flex flex-col items-center gap-1.5">
                                  <StatusIcon status={status} />
                                  {detail && (
                                    <p className="font-mono text-[11px] text-muted-foreground leading-tight max-w-[140px]">
                                      {detail}
                                    </p>
                                  )}
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
        </AnimatedItem>

        {/* Your Advantages */}
        {advantages.length > 0 && (
          <AnimatedItem>
            <div className="bg-card border border-border rounded-xl p-6 border-l-4 border-l-primary">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Your Advantages
              </h3>
              <ul className="space-y-2.5">
                {advantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedItem>
        )}

        {/* Executive Summary */}
        {summary && (
          <AnimatedItem>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Executive Summary
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{summary}</p>
            </div>
          </AnimatedItem>
        )}
      </AnimatedPage>
    </AppLayout>
  );
}
