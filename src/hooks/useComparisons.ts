import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useComparisons() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["comparisons", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comparison_matrices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useComparisonDetail(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["comparison-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comparison_matrices")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });
}
