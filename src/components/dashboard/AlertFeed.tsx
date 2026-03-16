import { Link } from "react-router-dom";
import { Bell, DollarSign, FileText, MessageSquare, Sparkles, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const alertTypeIcons: Record<string, typeof Bell> = {
  pricing_change: DollarSign,
  new_content: FileText,
  messaging_shift: MessageSquare,
  new_feature: Sparkles,
  review_change: Star,
};

const alertTypeBadgeColors: Record<string, string> = {
  pricing_change: "bg-warning/10 text-warning",
  new_content: "bg-primary/10 text-primary",
  messaging_shift: "bg-accent/10 text-accent",
  new_feature: "bg-info/10 text-info",
  review_change: "bg-warning-medium/10 text-warning-medium",
};

interface AlertFeedProps {
  alerts: Array<{
    id: string;
    title: string;
    description: string;
    alert_type: string;
    is_read: boolean;
    created_at: string;
    competitors: { name: string } | null;
  }>;
  loading?: boolean;
}

export function AlertFeed({ alerts, loading }: AlertFeedProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="h-5 w-24 skeleton-shimmer rounded mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-4 w-4 skeleton-shimmer rounded-full mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                <div className="h-3 w-full skeleton-shimmer rounded" />
                <div className="h-3 w-1/3 skeleton-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-150 hover:border-border-active hover:shadow-card-hover">
      <h3 className="text-base font-semibold text-foreground mb-5">Alert Feed</h3>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/[0.06] flex items-center justify-center mb-3">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No alerts yet</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Add competitors and run your first scrape to start monitoring.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {alerts.map((alert) => {
              const Icon = alertTypeIcons[alert.alert_type] || Bell;
              const badgeClass = alertTypeBadgeColors[alert.alert_type] || "bg-muted text-muted-foreground";
              const typeLabel = alert.alert_type.replace(/_/g, " ");

              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    {!alert.is_read ? (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    ) : (
                      <div className="h-2 w-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {alert.competitors && (
                        <span className="text-xs font-medium text-foreground">{alert.competitors.name}</span>
                      )}
                      <span className={`text-[11px] uppercase tracking-[0.05em] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${badgeClass}`}>
                        <Icon className="h-3 w-3" />
                        {typeLabel}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.description}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5 flex-shrink-0">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
          <Link
            to="/alerts"
            className="block text-center text-sm text-primary hover:underline font-medium mt-4 pt-4 border-t border-border"
          >
            View All Alerts
          </Link>
        </>
      )}
    </div>
  );
}
