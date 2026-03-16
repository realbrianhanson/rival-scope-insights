import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useReports(filters?: {
  competitorId?: string;
  reportType?: string;
  dateRange?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reports", user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from("analysis_reports")
        .select("*, competitors(name)")
        .order("created_at", { ascending: false });

      if (filters?.competitorId && filters.competitorId !== "all") {
        query = query.eq("competitor_id", filters.competitorId);
      }
      if (filters?.reportType && filters.reportType !== "all") {
        query = query.eq("report_type", filters.reportType);
      }
      if (filters?.dateRange && filters.dateRange !== "all") {
        const now = new Date();
        const days = parseInt(filters.dateRange);
        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", from.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useReportDetail(reportId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["report-detail", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analysis_reports")
        .select("*, competitors(name, website_url, industry)")
        .eq("id", reportId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!reportId && !!user,
  });
}
