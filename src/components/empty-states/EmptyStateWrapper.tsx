import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface EmptyStateWrapperProps {
  illustration: ReactNode;
  heading: string;
  subtext: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyStateWrapper({ illustration, heading, subtext, ctaLabel, onCta }: EmptyStateWrapperProps) {
  return (
    <div
      className="bg-card border border-border rounded-2xl p-12 text-center relative overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.02), transparent 70%)" }}
    >
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6">{illustration}</div>
        <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{subtext}</p>
        {ctaLabel && onCta && (
          <Button onClick={onCta} className="mt-5">
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
