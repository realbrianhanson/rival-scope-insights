import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentReports } from "@/components/dashboard/RecentReports";
import { TopOpportunities } from "@/components/dashboard/TopOpportunities";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { DashboardFAB } from "@/components/dashboard/DashboardFAB";
import { Target, TrendingUp, Zap, Bell } from "lucide-react";

const scoreColor = (score: number) => {
  if (score >= 9) return "#FF6B35";
  if (score >= 7) return "hsl(164, 100%, 42%)";
  if (score >= 4) return "#FFBE0B";
  return undefined;
};

export default function Index() {
  const { data: settings } = useAppSettings();
  const { user } = useAuth();
  const dashboard = useDashboardData();
  const appName = settings?.app_name || "RivalScope";
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        {/* Header */}
        <AnimatedItem>
          <h1 className="text-[28px] font-bold text-foreground">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your {appName} command center is ready.
          </p>
        </AnimatedItem>

        {/* Stat cards */}
        <AnimatedItem>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Competitors Tracked"
              value={dashboard.competitorCount}
              icon={Target}
              loading={dashboard.isLoading}
            />
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

      <DashboardFAB />
    </AppLayout>
  );
}
