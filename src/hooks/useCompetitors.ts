import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type Competitor = {
  id: string;
  user_id: string;
  name: string;
  website_url: string;
  description: string | null;
  industry: string | null;
  status: string;
  review_sources: Record<string, string> | null;
  created_at: string;
  updated_at: string;
};

export function useCompetitors() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["competitors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Competitor[];
    },
    enabled: !!user,
  });
}

export function useAddCompetitor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      website_url: string;
      description?: string;
      industry?: string;
      review_sources?: Record<string, string>;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("competitors")
        .insert({
          user_id: user.id,
          name: input.name,
          website_url: input.website_url,
          description: input.description || null,
          industry: input.industry || null,
          review_sources: input.review_sources && Object.keys(input.review_sources).length > 0
            ? input.review_sources
            : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-competitors"] });
      toast.success("Competitor added successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateCompetitorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("competitors")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-competitors"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useLastAnalyzedMap() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["last-analyzed", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analysis_reports")
        .select("competitor_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const r of data ?? []) {
        if (r.competitor_id && !map[r.competitor_id]) {
          map[r.competitor_id] = r.created_at;
        }
      }
      return map;
    },
    enabled: !!user,
  });
}
