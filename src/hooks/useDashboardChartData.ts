import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { subDays, startOfDay, format, eachDayOfInterval, startOfWeek } from "date-fns";

function bucketByWeek(dates: string[], days = 30) {
  const cutoff = subDays(new Date(), days);
  const weeks: Record<string, number> = {};
  // Create 5 weekly buckets
  for (let i = 4; i >= 0; i--) {
    const ws = startOfWeek(subDays(new Date(), i * 7));
    weeks[format(ws, "yyyy-MM-dd")] = 0;
  }
  dates.forEach((d) => {
    const date = new Date(d);
    if (date < cutoff) return;
    const ws = format(startOfWeek(date), "yyyy-MM-dd");
    if (ws in weeks) weeks[ws]++;
    else {
      // Find closest bucket
      const keys = Object.keys(weeks);
      const closest = keys.reduce((best, k) =>
        Math.abs(new Date(k).getTime() - date.getTime()) <
        Math.abs(new Date(best).getTime() - date.getTime()) ? k : best
      );
      weeks[closest]++;
    }
  });
  return Object.entries(weeks).map(([k, v]) => ({ name: k, value: v }));
}

function avgScoreByWeek(items: { created_at: string; score: number }[]) {
  const cutoff = subDays(new Date(), 30);
  const weeks: Record<string, { sum: number; count: number }> = {};
  for (let i = 4; i >= 0; i--) {
    const ws = startOfWeek(subDays(new Date(), i * 7));
    weeks[format(ws, "yyyy-MM-dd")] = { sum: 0, count: 0 };
  }
  items.forEach(({ created_at, score }) => {
    const date = new Date(created_at);
    if (date < cutoff) return;
    const ws = format(startOfWeek(date), "yyyy-MM-dd");
    if (ws in weeks) {
      weeks[ws].sum += score;
      weeks[ws].count++;
    }
  });
  return Object.entries(weeks).map(([k, v]) => ({
    name: k,
    value: v.count > 0 ? Math.round((v.sum / v.count) * 10) / 10 : 0,
  }));
}

export function useDashboardChartData() {
  const { user } = useAuth();
  const userId = user?.id;
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
  const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

  // Sparkline data
  const competitorDates = useQuery({
    queryKey: ["chart-competitor-dates", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitors")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo)
        .eq("status", "active");
      if (error) throw error;
      return bucketByWeek((data ?? []).map((d) => d.created_at));
    },
    enabled: !!userId,
  });

  const gapDates = useQuery({
    queryKey: ["chart-gap-dates", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_gaps")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo);
      if (error) throw error;
      return bucketByWeek((data ?? []).map((d) => d.created_at));
    },
    enabled: !!userId,
  });

  const gapScores = useQuery({
    queryKey: ["chart-gap-scores", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_gaps")
        .select("created_at, opportunity_score")
        .gte("created_at", thirtyDaysAgo);
      if (error) throw error;
      return avgScoreByWeek(
        (data ?? []).map((d) => ({ created_at: d.created_at, score: d.opportunity_score }))
      );
    },
    enabled: !!userId,
  });

  const alertDates = useQuery({
    queryKey: ["chart-alert-dates", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo);
      if (error) throw error;
      return bucketByWeek((data ?? []).map((d) => d.created_at));
    },
    enabled: !!userId,
  });

  // Activity timeline - 14 days
  const activityTimeline = useQuery({
    queryKey: ["chart-activity-timeline", userId],
    queryFn: async () => {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 13),
        end: new Date(),
      });

      const dayMap: Record<string, { scrapes: number; reports: number; gaps: number; alerts: number }> = {};
      days.forEach((d) => {
        dayMap[format(d, "yyyy-MM-dd")] = { scrapes: 0, reports: 0, gaps: 0, alerts: 0 };
      });

      const [scrapes, reports, gaps, alerts] = await Promise.all([
        supabase.from("scrape_jobs").select("started_at").gte("started_at", fourteenDaysAgo),
        supabase.from("analysis_reports").select("created_at").gte("created_at", fourteenDaysAgo),
        supabase.from("market_gaps").select("created_at").gte("created_at", fourteenDaysAgo),
        supabase.from("alerts").select("created_at").gte("created_at", fourteenDaysAgo),
      ]);

      (scrapes.data ?? []).forEach((r) => {
        const k = format(new Date(r.started_at), "yyyy-MM-dd");
        if (k in dayMap) dayMap[k].scrapes++;
      });
      (reports.data ?? []).forEach((r) => {
        const k = format(new Date(r.created_at), "yyyy-MM-dd");
        if (k in dayMap) dayMap[k].reports++;
      });
      (gaps.data ?? []).forEach((r) => {
        const k = format(new Date(r.created_at), "yyyy-MM-dd");
        if (k in dayMap) dayMap[k].gaps++;
      });
      (alerts.data ?? []).forEach((r) => {
        const k = format(new Date(r.created_at), "yyyy-MM-dd");
        if (k in dayMap) dayMap[k].alerts++;
      });

      return days.map((d) => {
        const k = format(d, "yyyy-MM-dd");
        return {
          day: format(d, "EEE"),
          date: k,
          ...dayMap[k],
        };
      });
    },
    enabled: !!userId,
  });

  // Gap category distribution
  const gapDistribution = useQuery({
    queryKey: ["chart-gap-distribution", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_gaps")
        .select("gap_category");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((g) => {
        counts[g.gap_category] = (counts[g.gap_category] || 0) + 1;
      });
      return counts;
    },
    enabled: !!userId,
  });

  return {
    competitorSparkline: competitorDates.data ?? [],
    gapSparkline: gapDates.data ?? [],
    scoreSparkline: gapScores.data ?? [],
    alertSparkline: alertDates.data ?? [],
    activityTimeline: activityTimeline.data ?? [],
    gapDistribution: gapDistribution.data ?? {},
    isLoading:
      competitorDates.isLoading ||
      gapDates.isLoading ||
      gapScores.isLoading ||
      alertDates.isLoading ||
      activityTimeline.isLoading ||
      gapDistribution.isLoading,
  };
}
