import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useCompetitorSuggestions(limit?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["competitor-suggestions", user?.id, limit],
    queryFn: async () => {
      let query = supabase
        .from("competitor_suggestions" as any)
        .select("*, competitors:source_competitor_id(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!user,
  });
}

export function useCompetitorSuggestionsByCompetitor(competitorId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["competitor-suggestions-by-competitor", competitorId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitor_suggestions" as any)
        .select("*")
        .eq("source_competitor_id", competitorId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!competitorId && !!user,
  });
}

export function useDismissSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("competitor_suggestions" as any)
        .update({ status: "dismissed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitor-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["competitor-suggestions-by-competitor"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAcceptSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("competitor_suggestions" as any)
        .update({ status: "added" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitor-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["competitor-suggestions-by-competitor"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
