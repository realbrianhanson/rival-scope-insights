import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useBattlecards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["battlecards", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("battlecards")
        .select("*, competitors(name, website_url)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useBattlecardDetail(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["battlecard-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("battlecards")
        .select("*, competitors(name, website_url, industry)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });
}
