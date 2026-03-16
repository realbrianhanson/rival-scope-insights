import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCompetitorDetail(competitorId: string | undefined) {
  const { user } = useAuth();

  const competitor = useQuery({
    queryKey: ["competitor-detail", competitorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitors")
        .select("*")
        .eq("id", competitorId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!competitorId && !!user,
  });

  const latestReport = useQuery({
    queryKey: ["competitor-latest-report", competitorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analysis_reports")
        .select("*")
        .eq("competitor_id", competitorId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!competitorId && !!user,
  });

  const allReports = useQuery({
    queryKey: ["competitor-reports", competitorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analysis_reports")
        .select("*")
        .eq("competitor_id", competitorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!competitorId && !!user,
  });

  const marketGaps = useQuery({
    queryKey: ["competitor-gaps", competitorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_gaps")
        .select("*")
        .eq("competitor_id", competitorId!)
        .order("opportunity_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!competitorId && !!user,
  });

  const reviewAnalyses = useQuery({
    queryKey: ["competitor-reviews", competitorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_analyses")
        .select("*")
        .eq("competitor_id", competitorId!)
        .order("analyzed_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!competitorId && !!user,
  });

  const scrapeJobs = useQuery({
    queryKey: ["competitor-scrape-jobs", competitorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scrape_jobs")
        .select("*")
        .eq("competitor_id", competitorId!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!competitorId && !!user,
  });

  const scrapeResults = useQuery({
    queryKey: ["competitor-scrape-results", competitorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scrape_results")
        .select("*")
        .eq("competitor_id", competitorId!)
        .order("scraped_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!competitorId && !!user,
  });

  const latestSnapshot = useQuery({
    queryKey: ["competitor-snapshot", competitorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitor_snapshots")
        .select("*")
        .eq("competitor_id", competitorId!)
        .order("captured_at", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!competitorId && !!user,
  });

  return {
    competitor,
    latestReport,
    allReports,
    marketGaps,
    reviewAnalyses,
    scrapeJobs,
    scrapeResults,
    latestSnapshot,
  };
}
