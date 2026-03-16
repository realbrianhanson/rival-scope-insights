import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useBattlecards } from "@/hooks/useBattlecards";
import { useCompetitors } from "@/hooks/useCompetitors";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Search, Loader2, Zap } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { EmptyStateWrapper } from "@/components/empty-states/EmptyStateWrapper";
import { ShieldAssembleIllustration } from "@/components/empty-states/ShieldAssembleIllustration";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Battlecards() {
  useDocumentTitle("Battlecards");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: battlecards, isLoading } = useBattlecards();
  const { data: competitors } = useCompetitors();
  const [search, setSearch] = useState("");
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const competitorsWithBattlecard = useMemo(() => {
    const bcCompIds = new Set((battlecards || []).map((b: any) => b.competitor_id));
    return {
      withCard: battlecards || [],
      without: (competitors || []).filter((c) => c.status === "active" && !bcCompIds.has(c.id)),
    };
  }, [battlecards, competitors]);

  const filteredCards = useMemo(() => {
    if (!search.trim()) return competitorsWithBattlecard.withCard;
    const q = search.toLowerCase();
    return competitorsWithBattlecard.withCard.filter(
      (b: any) => b.title?.toLowerCase().includes(q) || b.competitors?.name?.toLowerCase().includes(q)
    );
  }, [competitorsWithBattlecard.withCard, search]);

  const filteredWithout = useMemo(() => {
    if (!search.trim()) return competitorsWithBattlecard.without;
    const q = search.toLowerCase();
    return competitorsWithBattlecard.without.filter((c) => c.name.toLowerCase().includes(q));
  }, [competitorsWithBattlecard.without, search]);

  const handleGenerate = async (competitorId: string) => {
    if (!user) return;
    setGeneratingFor(competitorId);
    toast.info("Generating battlecard...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-battlecard", {
        body: { competitor_id: competitorId, user_id: user.id },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed");
      toast.success("Battlecard generated!");
      if (data.battlecard_id) navigate(`/battlecards/${data.battlecard_id}`);
    } catch (e: any) {
      toast.error(e.message);
    }
    setGeneratingFor(null);
  };

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        <AnimatedItem>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-[28px] font-bold text-foreground">Battlecards</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search battlecards..."
                className="pl-9 w-[220px]"
              />
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-3">
                  <div className="h-5 w-1/2 skeleton-shimmer rounded" />
                  <div className="h-3 w-3/4 skeleton-shimmer rounded" />
                  <div className="flex gap-2">
                    <div className="h-5 w-20 skeleton-shimmer rounded-full" />
                    <div className="h-5 w-20 skeleton-shimmer rounded-full" />
                    <div className="h-5 w-20 skeleton-shimmer rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCards.length === 0 && filteredWithout.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/[0.08] flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">No battlecards yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add competitors and run analysis to generate battlecards.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Existing battlecards */}
              {filteredCards.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredCards.map((bc: any) => {
                    const strengths = Array.isArray(bc.their_strengths) ? bc.their_strengths : [];
                    const weaknesses = Array.isArray(bc.their_weaknesses) ? bc.their_weaknesses : [];
                    const tracks = Array.isArray(bc.talk_tracks) ? bc.talk_tracks : [];
                    return (
                      <button
                        key={bc.id}
                        onClick={() => navigate(`/battlecards/${bc.id}`)}
                        className="w-full text-left bg-card border border-border rounded-xl p-5 transition-all hover:border-border-active hover:shadow-card-hover"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            {bc.competitors?.name || "Unknown"}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(bc.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {bc.overview?.slice(0, 100)}{bc.overview?.length > 100 ? "..." : ""}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                            {strengths.length} strengths
                          </span>
                          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
                            {weaknesses.length} weaknesses
                          </span>
                          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-info/10 text-info">
                            {tracks.length} talk tracks
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Not yet generated */}
              {filteredWithout.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Not Yet Generated
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredWithout.map((c) => (
                      <div key={c.id} className="bg-card border border-border border-dashed rounded-xl p-5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">{c.name}</h3>
                          <p className="text-xs font-mono text-muted-foreground truncate">{c.website_url.replace(/^https?:\/\//, "")}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerate(c.id)}
                          disabled={generatingFor === c.id}
                        >
                          {generatingFor === c.id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Zap className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Generate
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatedItem>
      </AnimatedPage>
    </AppLayout>
  );
}
