import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import {
  useAlerts,
  useAlertCounts,
  useMarkAlertRead,
  useMarkAllAlertsRead,
  useDeleteAlert,
} from "@/hooks/useAlerts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  DollarSign,
  FileText,
  MessageSquare,
  Star,
  ThumbsUp,
  CheckCheck,
  MoreVertical,
  ExternalLink,
  EyeOff,
  Trash2,
  Loader2,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAppSettings } from "@/hooks/useAppSettings";
import { EmptyStateWrapper } from "@/components/empty-states/EmptyStateWrapper";
import { BellSwingIllustration } from "@/components/empty-states/BellSwingIllustration";

const PAGE_SIZE = 20;

const TABS = [
  { key: "all", label: "All" },
  { key: "pricing_change", label: "Pricing" },
  { key: "new_content", label: "Content" },
  { key: "messaging_shift", label: "Messaging" },
  { key: "new_feature", label: "Features" },
  { key: "review_change", label: "Reviews" },
];

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  pricing_change: { icon: DollarSign, color: "bg-[hsl(44,100%,52%)]/15 text-[hsl(44,100%,52%)]" },
  new_content: { icon: FileText, color: "bg-[hsl(174,52%,55%)]/15 text-[hsl(174,52%,55%)]" },
  messaging_shift: { icon: MessageSquare, color: "bg-accent/15 text-accent" },
  new_feature: { icon: Star, color: "bg-primary/15 text-primary" },
  review_change: { icon: ThumbsUp, color: "bg-muted-foreground/15 text-muted-foreground" },
};

export default function AlertsPage() {
  useDocumentTitle("Alerts");
  const { data: appSettings } = useAppSettings();
  const appName = appSettings?.app_name || "RivalScope";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading } = useAlerts(visibleCount, 0, activeTab);
  const { data: countData } = useAlertCounts();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();
  const deleteAlert = useDeleteAlert();

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alerts = (data?.alerts ?? []).filter((a) => !dismissed.has(a.id));
  const total = data?.total ?? 0;
  const counts = countData?.counts ?? {};

  const handleInvestigate = useCallback(
    (alert: any) => {
      if (!alert.is_read) markRead.mutate(alert.id);
      navigate(`/competitors/${alert.competitor_id}`);
    },
    [navigate, markRead]
  );

  const handleDismiss = useCallback(
    (alert: any) => {
      markRead.mutate(alert.id);
      setDismissed((prev) => new Set(prev).add(alert.id));
      toast.success("Alert dismissed");
    },
    [markRead]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteAlert.mutate(id, {
        onSuccess: () => toast.success("Alert deleted"),
        onError: (e: any) => toast.error(e.message),
      });
    },
    [deleteAlert]
  );

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success("All alerts marked as read"),
    });
  };

  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        {/* Header */}
        <AnimatedItem>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[28px] font-bold text-foreground">Alerts</h1>
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
              {markAllRead.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-1.5 h-4 w-4" />
              )}
              Mark All Read
            </Button>
          </div>
        </AnimatedItem>

        {/* Tabs */}
        <AnimatedItem>
          <div className="flex gap-1.5 flex-wrap">
            {TABS.map((tab) => {
              const count = tab.key === "all" ? counts.all || 0 : counts[tab.key] || 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "text-[10px] min-w-[18px] text-center px-1 py-0.5 rounded-full",
                      activeTab === tab.key
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-foreground/10 text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </AnimatedItem>

        {/* Feed */}
        <AnimatedItem>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <div className="h-4 w-24 skeleton-shimmer rounded" />
                  <div className="h-5 w-2/3 skeleton-shimmer rounded" />
                  <div className="h-3 w-full skeleton-shimmer rounded" />
                  <div className="h-3 w-1/3 skeleton-shimmer rounded" />
                </div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const cfg = typeConfig[alert.alert_type] || { icon: Bell, color: "bg-muted text-muted-foreground" };
                const Icon = cfg.icon;
                const typeLabel = alert.alert_type.replace(/_/g, " ");

                return (
                  <div
                    key={alert.id}
                    className="bg-card border border-border rounded-xl p-5 transition-all hover:border-border-active hover:shadow-card-hover"
                    onClick={() => {
                      if (!alert.is_read) markRead.mutate(alert.id);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Unread indicator */}
                      <div className="pt-2 flex-shrink-0 w-3">
                        {!alert.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Type badge + competitor */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "text-[11px] uppercase tracking-[0.05em] font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1",
                              cfg.color
                            )}
                          >
                            <Icon className="h-3 w-3" />
                            {typeLabel}
                          </span>
                          {alert.competitors && (
                            <span className="text-xs text-muted-foreground">
                              {alert.competitors.name}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-semibold text-foreground">{alert.title}</h3>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {alert.description}
                        </p>

                        {/* Diff */}
                        {alert.old_value && alert.new_value && (
                          <div className="rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs space-y-1">
                            <div className="text-destructive line-through">
                              {typeof alert.old_value === "string"
                                ? alert.old_value
                                : JSON.stringify(alert.old_value)}
                            </div>
                            <div className="text-primary">
                              {typeof alert.new_value === "string"
                                ? alert.new_value
                                : JSON.stringify(alert.new_value)}
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-[11px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInvestigate(alert);
                          }}
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Investigate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-8 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(alert);
                          }}
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(alert.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load More */}
              {visibleCount < total && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </AnimatedItem>
      </AnimatedPage>
    </AppLayout>
  );
}

function EmptyState() {
  return (
    <EmptyStateWrapper
      illustration={<BellSwingIllustration />}
      heading="No alerts yet"
      subtext={`Once you start scanning competitors, ${appName} will detect changes and alert you here.`}
    />
  );
}
