import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const { data: settings } = useAppSettings();
  const { user } = useAuth();
  const appName = settings?.app_name || "RivalScope";
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <AppLayout>
      <AnimatedPage className="space-y-8">
        <AnimatedItem>
          <h1 className="text-[28px] font-bold text-foreground">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your {appName} command center is ready.
          </p>
        </AnimatedItem>

        {/* Empty state */}
        <AnimatedItem>
          <div className="relative bg-card border border-border rounded-2xl p-12 text-center overflow-hidden">
            {/* Geometric pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            {/* Radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.04),transparent_70%)]" />

            <div className="relative z-10 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/[0.08] flex items-center justify-center">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Start tracking competitors</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Add your first competitor to unlock market intelligence, battlecards, and gap analysis.
              </p>
              <Button asChild className="mt-2">
                <Link to="/competitors">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Competitor
                </Link>
              </Button>
            </div>
          </div>
        </AnimatedItem>
      </AnimatedPage>
    </AppLayout>
  );
}
