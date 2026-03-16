import { useState } from "react";
import { Compass, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompetitorSuggestions, useDismissSuggestion, useAcceptSuggestion } from "@/hooks/useCompetitorSuggestions";
import { AddCompetitorModal } from "@/components/competitors/AddCompetitorModal";

const relevanceColors: Record<string, string> = {
  direct_competitor: "bg-destructive/10 text-destructive",
  indirect_competitor: "bg-warning/10 text-warning",
  emerging_threat: "bg-[hsl(22,100%,60%)]/10 text-[hsl(22,100%,60%)]",
  adjacent_market: "bg-accent/10 text-accent",
};

interface SuggestedCompetitorsProps {
  loading?: boolean;
}

export function SuggestedCompetitors({ loading }: SuggestedCompetitorsProps) {
  const { data: suggestions, isLoading } = useCompetitorSuggestions(3);
  const dismiss = useDismissSuggestion();
  const accept = useAcceptSuggestion();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ name: string; url: string } | null>(null);

  const handleTrack = (suggestion: any) => {
    setPrefill({ name: suggestion.suggested_name, url: suggestion.suggested_url });
    accept.mutate(suggestion.id);
    setAddModalOpen(true);
  };

  if (loading || isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="h-5 w-44 skeleton-shimmer rounded mb-5" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 skeleton-shimmer rounded" />
                <div className="h-3 w-1/2 skeleton-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-150 hover:border-border-active hover:shadow-card-hover">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-8 w-8 rounded-lg bg-primary/[0.08] flex items-center justify-center">
            <Compass className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Suggested Competitors</h3>
        </div>

        {!suggestions || suggestions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Analyze more competitors to get discovery suggestions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((s: any) => (
              <div key={s.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{s.suggested_name}</span>
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                        relevanceColors[s.relevance] || "bg-muted text-muted-foreground"
                      )}>
                        {s.relevance?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">{s.suggested_url}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs px-2.5"
                      onClick={() => handleTrack(s)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Track
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => dismiss.mutate(s.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddCompetitorModal
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) setPrefill(null);
        }}
        defaultName={prefill?.name}
        defaultUrl={prefill?.url}
      />
    </>
  );
}
