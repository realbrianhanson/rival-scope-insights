import { LayoutDashboard, Users, TrendingUp, Bell, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Competitors", url: "/competitors", icon: Users },
  { title: "Gaps", url: "/market-gaps", icon: TrendingUp },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function MobileNav() {
  const location = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex justify-around py-2 px-1">
      {items.map((item) => {
        const active = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
        return (
          <Link
            key={item.title}
            to={item.url}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
