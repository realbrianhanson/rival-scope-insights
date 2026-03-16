import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useDashboardData } from "@/hooks/useDashboardData";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentReports } from "@/components/dashboard/RecentReports";
import { TopOpportunities } from "@/components/dashboard/TopOpportunities";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { ThreatRadar } from "@/components/dashboard/ThreatRadar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, TrendingUp, Zap, Bell, ShieldAlert, Newspaper, Loader2, CheckCircle2, Circle, Brain, Database, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const scoreColor = (score: number) => {
  if (score >= 9) return "#FF6B35";
  if (score >= 7) return "hsl(164, 100%, 42%)";
  if (score >= 4) return "#FFBE0B";
  return undefined;
};

const threatColor = (score: number) => {
  if (score >= 76) return "#FF4757";
  if (score >= 51) return "#FF6B35";
  if (score >= 26) return "#FFBE0B";
  return "#00D4AA";
};

const briefingSteps = [
  { label: "Gathering intelligence", icon: Database },
  { label: "Analyzing threats", icon: Brain },
  { label: "Building briefing", icon: FileText },
];

export default function Index() {
  const { data: settings } = useAppSettings();
  const { user } = useAuth();
  const dashboard = useDashboardData();
  const appName = settings?.app_name || "RivalScope";
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingStep, setBriefingStep] = useState(0);

  const handleGenerateBriefing = async () => {
    if (!user) return;
    setBriefingLoading(true);
    setBriefingStep(0);

    try {
      const stepTimer1 = setTimeout(() => setBriefingStep(1), 3000);
      const stepTimer2 = setTimeout(() => setBriefingStep(2), 6000);

      const { data, error } = await supabase.functions.invoke("generate-executive-briefing", {
        body: { user_id: user.id },
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to generate briefing");

      toast.success("Executive briefing generated!");
      if (data?.report_id) {
        navigate(`/reports/${data.report_id}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setBriefingLoading(false);
    setBriefingStep(0);
  };

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        {/* Header */}
        <AnimatedItem>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold text-foreground">Welcome back, {firstName}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Your {appName} command center is ready.
              </p>
            </div>
            <Button variant="outline" onClick={handleGenerateBriefing} disabled={briefingLoading}>
              <Newspaper className="mr-1.5 h-4 w-4" />
              Generate Weekly Briefing
            </Button>
          </div>
        </AnimatedItem>

        {/* Stat cards */}
        <AnimatedItem>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Threat Overview — replaces simple competitor count */}
            <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-150 hover:border-border-active hover:shadow-card-hover">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
                  Threat Overview
                </span>
                <div className="h-9 w-9 rounded-lg bg-primary/[0.08] flex items-center justify-center">
                  <ShieldAlert className="h-[18px] w-[18px] text-primary" />
                </div>
              </div>
              {dashboard.isLoading ? (
                <div className="h-9 w-16 skeleton-shimmer rounded" />
              ) : dashboard.highestThreat ? (
                <div>
                  <span
                    className="font-mono text-4xl font-bold leading-none"
                    style={{ color: threatColor(dashboard.highestThreat.threat_score ?? 0) }}
                  >
                    {dashboard.highestThreat.threat_score}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1.5 truncate">
                    {dashboard.highestThreat.name} · {dashboard.competitorCount} tracked
                  </p>
                </div>
              ) : (
                <div>
                  <span className="font-mono text-4xl font-bold leading-none text-foreground">
                    {dashboard.competitorCount}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1.5">competitors tracked</p>
                </div>
              )}
            </div>

            <StatCard
              title="Market Gaps Found"
              value={dashboard.gapCount}
              icon={TrendingUp}
              loading={dashboard.isLoading}
            />
            <StatCard
              title="Opportunity Score"
              value={dashboard.avgScore}
              icon={Zap}
              decimals={1}
              color={scoreColor(dashboard.avgScore)}
              loading={dashboard.isLoading}
            />
            <StatCard
              title="Unread Alerts"
              value={dashboard.unreadAlerts}
              icon={Bell}
              pulse={dashboard.unreadAlerts > 0}
              loading={dashboard.isLoading}
            />
          </div>
        </AnimatedItem>

        {/* Threat Radar */}
        <AnimatedItem>
          <ThreatRadar competitors={dashboard.competitors} loading={dashboard.isLoading} />
        </AnimatedItem>

        {/* Middle row */}
        <AnimatedItem>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            <div className="lg:col-span-3">
              <RecentReports reports={dashboard.recentReports} loading={dashboard.isLoading} />
            </div>
            <div className="lg:col-span-2">
              <TopOpportunities opportunities={dashboard.topOpportunities} loading={dashboard.isLoading} />
            </div>
          </div>
        </AnimatedItem>

        {/* Bottom row */}
        <AnimatedItem>
          <AlertFeed alerts={dashboard.recentAlerts} loading={dashboard.isLoading} />
        </AnimatedItem>
      </AnimatedPage>
    </AppLayout>
  );
}
