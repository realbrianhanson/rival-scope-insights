import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useBattlecardDetail } from "@/hooks/useBattlecards";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { format } from "date-fns";
import {
  ArrowLeft,
  Shield,
  RefreshCw,
  Printer,
  Loader2,
} from "lucide-react";

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 skeleton-shimmer rounded" />
      <div className="h-4 w-48 skeleton-shimmer rounded" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-3">
          <div className="h-4 w-1/3 skeleton-shimmer rounded" />
          <div className="h-3 w-2/3 skeleton-shimmer rounded" />
          <div className="h-3 w-1/2 skeleton-shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

export default function BattlecardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: bc, isLoading, refetch } = useBattlecardDetail(id);
  const [regenerating, setRegenerating] = useState(false);

  const comp = bc?.competitors as any;
  useDocumentTitle(comp?.name ? `Battlecard: ${comp.name}` : "Battlecard");

  const handleRegenerate = async () => {
    if (!user || !bc) return;
    setRegenerating(true);
    toast.info("Regenerating battlecard...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-battlecard", {
        body: { competitor_id: bc.competitor_id, user_id: user.id },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed");
      toast.success("Battlecard regenerated!");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
    setRegenerating(false);
  };

  if (isLoading) {
    return <AppLayout><DetailSkeleton /></AppLayout>;
  }

  if (!bc) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Battlecard not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/battlecards")}>Back to Battlecards</Button>
        </div>
      </AppLayout>
    );
  }

  const strengths = (Array.isArray(bc.their_strengths) ? bc.their_strengths : []) as string[];
  const weaknesses = (Array.isArray(bc.their_weaknesses) ? bc.their_weaknesses : []) as string[];
  const counterPos = (Array.isArray(bc.counter_positioning) ? bc.counter_positioning : []) as any[];
  const talkTracks = (Array.isArray(bc.talk_tracks) ? bc.talk_tracks : []) as string[];
  const differentiators = (Array.isArray(bc.key_differentiators) ? bc.key_differentiators : []) as string[];
  const pricing = bc.pricing_comparison as any;

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6 print:space-y-4">
        {/* Back */}
        <AnimatedItem className="print:hidden">
          <button
            onClick={() => navigate("/battlecards")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Battlecards
          </button>
        </AnimatedItem>

        {/* Header */}
        <AnimatedItem>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-[28px] font-bold text-foreground">
                  Battlecard: {comp?.name || "Unknown"}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated {format(new Date(bc.updated_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                Regenerate
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" />
                Print / Export
              </Button>
            </div>
          </div>
        </AnimatedItem>

        {/* Overview */}
        {bc.overview && (
          <AnimatedItem>
            <div className="bg-card border border-border rounded-xl p-6 border-l-4 border-l-primary">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overview</h3>
              <p className="text-sm text-foreground leading-relaxed">{bc.overview}</p>
            </div>
          </AnimatedItem>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <AnimatedItem>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Their Strengths</h3>
              <ul className="space-y-2.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedItem>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <AnimatedItem>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Their Weaknesses</h3>
              <ul className="space-y-2.5">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-destructive flex-shrink-0" />
                    <span className="text-sm text-foreground">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedItem>
        )}

        {/* Counter-Positioning */}
        {counterPos.length > 0 && (
          <AnimatedItem>
            <div className="bg-card border border-border rounded-xl p-6 border-l-4 border-l-accent">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Counter-Positioning</h3>
              <Accordion type="multiple" className="space-y-2">
                {counterPos.map((cp, i) => (
                  <AccordionItem key={i} value={`cp-${i}`} className="border border-border rounded-lg px-4">
                    <AccordionTrigger className="py-3 hover:no-underline text-left">
                      <span className="text-sm font-semibold text-foreground">{cp.objection || cp}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground pb-2">{cp.response || ""}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </AnimatedItem>
        )}

        {/* Pricing Comparison */}
        {pricing && (
          <AnimatedItem>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Pricing Comparison</h3>
              {pricing.summary && <p className="text-sm text-foreground mb-3">{pricing.summary}</p>}
              {pricing.their_price_range && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Their Price Range</p>
                  <p className="font-mono text-lg font-bold text-foreground">{pricing.their_price_range}</p>
                </div>
              )}
              {pricing.positioning_tip && (
                <div className="p-4 rounded-lg bg-primary/[0.06] border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">Positioning Tip</p>
                  <p className="text-sm text-foreground">{pricing.positioning_tip}</p>
                </div>
              )}
            </div>
          </AnimatedItem>
        )}

        {/* Talk Tracks */}
        {talkTracks.length > 0 && (
          <AnimatedItem>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Talk Tracks</h3>
              <ol className="space-y-3">
                {talkTracks.map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <p className="text-[15px] text-foreground leading-relaxed pt-0.5">{t}</p>
                  </li>
                ))}
              </ol>
            </div>
          </AnimatedItem>
        )}

        {/* Key Differentiators */}
        {differentiators.length > 0 && (
          <AnimatedItem>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Key Differentiators</h3>
              <div className="flex flex-wrap gap-2">
                {differentiators.map((d, i) => (
                  <span key={i} className="text-sm px-4 py-2 rounded-full bg-info/10 text-info font-medium">{d}</span>
                ))}
              </div>
            </div>
          </AnimatedItem>
        )}

        {/* Bottom link */}
        <AnimatedItem className="print:hidden">
          <div className="text-center pt-4">
            <button
              onClick={() => navigate("/battlecards")}
              className="text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
            >
              Generate for another competitor
            </button>
          </div>
        </AnimatedItem>
      </AnimatedPage>
    </AppLayout>
  );
}
