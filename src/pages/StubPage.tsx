import { AppLayout } from "@/components/AppLayout";
import { AnimatedPage, AnimatedItem } from "@/components/AnimatedPage";
import { LucideIcon } from "lucide-react";

interface StubPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function StubPage({ title, description, icon: Icon }: StubPageProps) {
  return (
    <AppLayout>
      <AnimatedPage className="space-y-6">
        <AnimatedItem>
          <h1 className="text-[28px] font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        </AnimatedItem>
        <AnimatedItem>
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              This feature is under development. Check back soon.
            </p>
          </div>
        </AnimatedItem>
      </AnimatedPage>
    </AppLayout>
  );
}
