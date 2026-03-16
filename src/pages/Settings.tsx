import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/hooks/useTheme";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  User,
  Palette,
  Bell,
  BarChart3,
  Save,
  Loader2,
  Sun,
  Moon,
  Info,
  Link2,
  Trash2,
  ExternalLink,
  Eye,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAllSharedLinks, useDisableSharedLink, useDisableAllSharedLinks } from "@/hooks/useSharedLinks";
import { formatDistanceToNow } from "date-fns";

const INDUSTRIES = [
  "SaaS", "E-commerce", "Fintech", "Healthcare", "EdTech",
  "Marketing", "Cybersecurity", "AI/ML", "Developer Tools",
  "Media", "Real Estate", "Logistics", "Other",
];

export default function SettingsPage() {
  useDocumentTitle("Settings");
  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        <AnimatedItem>
          <h1 className="text-[28px] font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account and app configuration.</p>
        </AnimatedItem>
        <AnimatedItem>
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-muted/50 border border-border">
              <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" />Profile</TabsTrigger>
              <TabsTrigger value="appearance" className="gap-1.5"><Palette className="h-3.5 w-3.5" />Appearance</TabsTrigger>
              <TabsTrigger value="shared" className="gap-1.5"><Link2 className="h-3.5 w-3.5" />Shared Links</TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Notifications</TabsTrigger>
              <TabsTrigger value="usage" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Usage</TabsTrigger>
            </TabsList>

            <TabsContent value="profile"><ProfileTab /></TabsContent>
            <TabsContent value="appearance"><AppearanceTab /></TabsContent>
            <TabsContent value="shared"><SharedLinksTab /></TabsContent>
            <TabsContent value="notifications"><NotificationsTab /></TabsContent>
            <TabsContent value="usage"><UsageTab /></TabsContent>
          </Tabs>
        </AnimatedItem>
      </AnimatedPage>
    </AppLayout>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const { data: settings } = useAppSettings();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [appName, setAppName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#00D4AA");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setFullName(profile.full_name || "");
    setCompanyName(profile.company_name || "");
    setIndustry(profile.industry || "");
    setAppName(settings?.app_name || "RivalScope");
    setPrimaryColor(settings?.primary_color || "#00D4AA");
    setInitialized(true);
  }

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ full_name: fullName, company_name: companyName, industry })
        .eq("id", user.id);
      if (pErr) throw pErr;

      const { error: sErr } = await supabase
        .from("app_settings")
        .update({ app_name: appName, primary_color: primaryColor })
        .eq("user_id", user.id);
      if (sErr) throw sErr;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Info</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input value={user?.email || ""} disabled className="mt-1.5 bg-muted/30" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">App Branding</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">App Name</Label>
            <Input value={appName} onChange={(e) => setAppName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Primary Accent Color</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 font-mono text-sm" />
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
        Save Changes
      </Button>
    </div>
  );
}

function AppearanceTab() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-xl">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Theme</h3>
      <div className="grid grid-cols-2 gap-4">
        {(["light", "dark"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { if (theme !== t) toggleTheme(); }}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              theme === t
                ? "border-primary bg-primary/[0.04]"
                : "border-border hover:border-border-active"
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              {t === "light" ? <Sun className="h-5 w-5 text-warning-medium" /> : <Moon className="h-5 w-5 text-accent" />}
              <span className="text-sm font-semibold text-foreground capitalize">{t} Mode</span>
            </div>
            <div
              className={cn(
                "rounded-lg p-3 space-y-2 text-xs",
                t === "light" ? "bg-[hsl(230,20%,97%)] text-[hsl(240,33%,14%)]" : "bg-[hsl(240,33%,5%)] text-[hsl(240,14%,95%)]"
              )}
            >
              <div className="h-2 w-3/4 rounded" style={{ background: t === "light" ? "#e2e2ea" : "#2a2a3e" }} />
              <div className="h-2 w-1/2 rounded" style={{ background: t === "light" ? "#e2e2ea" : "#2a2a3e" }} />
              <div className="h-2 w-full rounded" style={{ background: "#00D4AA", opacity: 0.3 }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-6 max-w-xl">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email Alerts</h3>
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div>
          <p className="text-sm font-medium text-foreground">Email Notifications</p>
          <p className="text-xs text-muted-foreground mt-0.5">Get alerted when competitors make changes</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Coming soon</span>
          <Switch disabled />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alert Frequency</h3>
      <div className="space-y-2">
        {["Instant", "Daily Digest", "Weekly Digest"].map((freq) => (
          <label key={freq} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl opacity-50 cursor-not-allowed">
            <span className="text-sm font-medium text-foreground">{freq}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Coming soon</span>
              <div className="w-4 h-4 rounded-full border-2 border-border" />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function UsageTab() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["usage-stats", user?.id],
    queryFn: async () => {
      const [competitors, scrapes, reports, gaps] = await Promise.all([
        supabase.from("competitors").select("id", { count: "exact", head: true }),
        supabase.from("scrape_jobs").select("id", { count: "exact", head: true }),
        supabase.from("analysis_reports").select("id", { count: "exact", head: true }),
        supabase.from("market_gaps").select("id", { count: "exact", head: true }),
      ]);
      return {
        competitors: competitors.count ?? 0,
        scrapes: scrapes.count ?? 0,
        reports: reports.count ?? 0,
        gaps: gaps.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const stats = [
    { label: "Competitors Tracked", value: data?.competitors ?? 0 },
    { label: "Scrapes Run", value: data?.scrapes ?? 0 },
    { label: "Reports Generated", value: data?.reports ?? 0 },
    { label: "Market Gaps Found", value: data?.gaps ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 w-16 skeleton-shimmer rounded" />
                <div className="h-3 w-24 skeleton-shimmer rounded" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 p-4 bg-primary/[0.04] border border-primary/10 rounded-xl">
        <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Cloud & AI usage is managed in your Lovable workspace settings.
        </p>
      </div>
    </div>
  );
}

function SharedLinksTab() {
  const { data: links, isLoading } = useAllSharedLinks();
  const disableLink = useDisableSharedLink();
  const disableAll = useDisableAllSharedLinks();

  const contentTypeLabels: Record<string, string> = {
    report: "Report",
    battlecard: "Battlecard",
    comparison: "Comparison",
  };

  const contentTypeBadge: Record<string, string> = {
    report: "bg-primary/10 text-primary",
    battlecard: "bg-accent/10 text-accent",
    comparison: "bg-warning/10 text-warning",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Shared Links</h3>
        {links && links.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => disableAll.mutate()} disabled={disableAll.isPending}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Disable All
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-2">
              <div className="h-4 w-1/3 skeleton-shimmer rounded" />
              <div className="h-3 w-2/3 skeleton-shimmer rounded" />
            </div>
          ))}
        </div>
      ) : !links || links.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-foreground">No active shared links</p>
          <p className="text-xs text-muted-foreground mt-1">Share reports, battlecards, or comparisons to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link: any) => {
            const shareUrl = `${window.location.origin}/shared/${link.share_token}`;
            return (
              <div key={link.id} className="bg-card border border-border rounded-xl p-5 transition-all hover:border-border-active">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
                        contentTypeBadge[link.content_type] || "bg-muted text-muted-foreground"
                      )}>
                        {contentTypeLabels[link.content_type] || link.content_type}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {link.view_count} view{link.view_count !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">{shareUrl}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Created {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}</span>
                      {link.expires_at && (
                        <span>Expires {formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        toast("Link copied!");
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8"
                      onClick={() => disableLink.mutate(link.id)}
                      disabled={disableLink.isPending}
                    >
                      Disable
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
