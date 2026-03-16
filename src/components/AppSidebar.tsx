import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  TrendingUp,
  GitCompareArrows,
  Bell,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUnreadAlertCount } from "@/hooks/useAlerts";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Competitors", url: "/competitors", icon: Users },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Battlecards", url: "/battlecards", icon: Shield },
  { title: "Market Gaps", url: "/market-gaps", icon: TrendingUp },
  { title: "Comparisons", url: "/comparisons", icon: GitCompareArrows },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { data: settings } = useAppSettings();
  const { data: unreadCount } = useUnreadAlertCount();
  const [collapsed, setCollapsed] = useState(false);

  const appName = settings?.app_name || "RivalScope";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-background border-r border-border transition-all duration-200 ease-in-out flex-shrink-0",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!collapsed && (
          <span className="font-display text-2xl tracking-tight text-foreground" style={{ letterSpacing: "-0.02em" }}>
            {appName}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
          const content = (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "text-foreground bg-primary/[0.06] border-l-[3px] border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border-l-[3px] border-transparent"
              )}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            );
          }
          return content;
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-border space-y-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Toggle theme</TooltipContent>}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={signOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-[18px] w-[18px]" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Sign out</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );
}
