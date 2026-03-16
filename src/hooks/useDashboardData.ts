import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDashboardData() {
  const { user } = useAuth();
  const userId = user?.id;

  const competitorsQuery = useQuery({
    queryKey: ["dashboard-competitors", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitors")
        .select("id, name, threat_score, threat_level, status")
        .eq("status", "active");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const marketGaps = useQuery({
    queryKey: ["dashboard-market-gaps", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_gaps")
        .select("opportunity_score");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const unreadAlerts = useQuery({
    queryKey: ["dashboard-unread-alerts", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
  });

  const recentReports = useQuery({
    queryKey: ["dashboard-recent-reports", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analysis_reports")
        .select("id, title, report_type, created_at, competitor_id, competitors(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const topOpportunities = useQuery({
    queryKey: ["dashboard-top-opportunities", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_gaps")
        .select("id, gap_title, gap_category, opportunity_score, competitor_id, competitors(name)")
        .order("opportunity_score", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const recentAlerts = useQuery({
    queryKey: ["dashboard-recent-alerts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("id, title, description, alert_type, is_read, created_at, competitor_id, competitors(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const competitors = competitorsQuery.data ?? [];
  const competitorCount = competitors.length;
  const gapCount = marketGaps.data?.length ?? 0;
  const avgScore =
    marketGaps.data && marketGaps.data.length > 0
      ? marketGaps.data.reduce((sum, g) => sum + g.opportunity_score, 0) / marketGaps.data.length
      : 0;

  // Find highest threat competitor
  const scoredCompetitors = competitors.filter((c) => c.threat_score !== null);
  const highestThreat = scoredCompetitors.length > 0
    ? scoredCompetitors.reduce((max, c) => (c.threat_score ?? 0) > (max.threat_score ?? 0) ? c : max, scoredCompetitors[0])
    : null;

  return {
    competitorCount,
    competitors,
    highestThreat,
    gapCount,
    avgScore,
    unreadAlerts: unreadAlerts.data ?? 0,
    recentReports: recentReports.data ?? [],
    topOpportunities: topOpportunities.data ?? [],
    recentAlerts: recentAlerts.data ?? [],
    isLoading:
      competitorsQuery.isLoading ||
      marketGaps.isLoading ||
      unreadAlerts.isLoading ||
      recentReports.isLoading ||
      topOpportunities.isLoading ||
      recentAlerts.isLoading,
  };
}
