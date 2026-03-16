import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  decimals?: number;
  suffix?: string;
  loading?: boolean;
  color?: string;
  pulse?: boolean;
  sparklineData?: Array<{ name: string; value: number }>;
  sparklineColor?: string;
  sparklineDelay?: number;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  decimals = 0,
  loading,
  color,
  pulse,
  sparklineData,
  sparklineColor,
  sparklineDelay = 200,
}: StatCardProps) {
  const displayValue = useCountUp(value, 600, decimals);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 skeleton-shimmer rounded" />
          <div className="h-8 w-8 skeleton-shimmer rounded-lg" />
        </div>
        <div className="h-9 w-16 skeleton-shimmer rounded mt-1" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl p-6 transition-all duration-150 hover:border-border-active hover:shadow-card-hover relative overflow-hidden",
        pulse && "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] border-primary/30"
      )}
    >
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
          {title}
        </span>
        <div className="h-9 w-9 rounded-lg bg-primary/[0.08] flex items-center justify-center">
          <Icon className="h-[18px] w-[18px] text-primary" />
        </div>
      </div>
      <span
        className="font-mono text-4xl font-bold leading-none relative z-10"
        style={{ color: color || "hsl(var(--foreground))" }}
      >
        {displayValue}
      </span>
      {sparklineData && sparklineColor && (
        <Sparkline data={sparklineData} color={sparklineColor} animationDelay={sparklineDelay} />
      )}
    </div>
  );
}
