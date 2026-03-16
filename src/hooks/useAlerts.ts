import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface Alert {
  id: string;
  user_id: string;
  competitor_id: string;
  alert_type: string;
  title: string;
  description: string;
  is_read: boolean;
  old_value: any;
  new_value: any;
  created_at: string;
  competitors: { name: string } | null;
}

export function useAlerts(limit = 20, offset = 0, typeFilter?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["alerts", user?.id, limit, offset, typeFilter],
    queryFn: async () => {
      let q = supabase
        .from("alerts")
        .select("*, competitors(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (typeFilter && typeFilter !== "all") {
        q = q.eq("alert_type", typeFilter);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { alerts: (data ?? []) as Alert[], total: count ?? 0 };
    },
    enabled: !!user,
  });
}

export function useAlertCounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["alert-counts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("alert_type, is_read");
      if (error) throw error;
      const counts: Record<string, number> = { all: 0 };
      let unread = 0;
      for (const a of data ?? []) {
        counts.all = (counts.all || 0) + 1;
        counts[a.alert_type] = (counts[a.alert_type] || 0) + 1;
        if (!a.is_read) unread++;
      }
      return { counts, unread };
    },
    enabled: !!user,
  });
}

export function useUnreadAlertCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-alert-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("alerts-unread")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-alert-count"] });
          queryClient.invalidateQueries({ queryKey: ["alert-counts"] });
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-counts"] });
      queryClient.invalidateQueries({ queryKey: ["unread-alert-count"] });
    },
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-counts"] });
      queryClient.invalidateQueries({ queryKey: ["unread-alert-count"] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-counts"] });
      queryClient.invalidateQueries({ queryKey: ["unread-alert-count"] });
    },
  });
}
