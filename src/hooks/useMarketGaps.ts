import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useMarketGaps() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["market-gaps", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_gaps")
        .select("*, competitors(name)")
        .order("opportunity_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useUpdateGapStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("market_gaps")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-gaps"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
