import { useState } from "react";
import { Plus, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function DashboardFAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 md:bottom-8 right-6 z-40">
      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-16 right-0 bg-card border border-border rounded-xl shadow-card p-1.5 min-w-[180px] animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Link
            to="/competitors"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            Add Competitor
          </Link>
          <Link
            to="/reports"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Zap className="h-4 w-4 text-muted-foreground" />
            Run Analysis
          </Link>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center",
          "shadow-[0_4px_20px_hsl(var(--primary)/0.35)] hover:shadow-glow",
          "transition-all duration-150 hover:scale-105 active:scale-95"
        )}
      >
        <Plus className={cn("h-6 w-6 transition-transform duration-200", open && "rotate-45")} />
      </button>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />}
    </div>
  );
}
