import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface ThreatCompetitor {
  id: string;
  name: string;
  threat_score: number | null;
  threat_level: string | null;
}

interface ThreatRadarProps {
  competitors: ThreatCompetitor[];
  loading?: boolean;
}

const threatScoreColor = (score: number) => {
  if (score >= 76) return "#FF4757";
  if (score >= 51) return "#FF6B35";
  if (score >= 26) return "#FFBE0B";
  return "#00D4AA";
};

const threatLevelBadge: Record<string, string> = {
  critical: "bg-[#FF4757]/10 text-[#FF4757]",
  high: "bg-[#FF6B35]/10 text-[#FF6B35]",
  moderate: "bg-[#FFBE0B]/10 text-[#FFBE0B]",
  low: "bg-primary/10 text-primary",
};

export function ThreatRadar({ competitors, loading }: ThreatRadarProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="h-4 w-48 skeleton-shimmer rounded mb-4" />
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="min-w-[200px] bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="h-4 w-24 skeleton-shimmer rounded" />
              <div className="h-10 w-16 skeleton-shimmer rounded" />
              <div className="h-3 w-full skeleton-shimmer rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const scored = competitors
    .filter((c) => c.threat_score !== null)
    .sort((a, b) => (b.threat_score ?? 0) - (a.threat_score ?? 0));

  if (scored.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground mb-3">Competitor Threat Radar</h3>
        <p className="text-sm text-muted-foreground">Run a full scan to generate threat scores for your competitors.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground mb-4">Competitor Threat Radar</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {scored.map((c) => {
          const score = c.threat_score!;
          const color = threatScoreColor(score);
          return (
            <button
              key={c.id}
              onClick={() => navigate(`/competitors/${c.id}`)}
              className="min-w-[180px] flex-shrink-0 bg-muted/30 border border-border rounded-xl p-4 text-left hover:border-border-active hover:shadow-card-hover transition-all"
            >
              <p className="text-sm font-semibold text-foreground truncate mb-2">{c.name}</p>
              <p className="font-mono text-3xl font-bold leading-none mb-2" style={{ color }}>{score}</p>
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
                threatLevelBadge[c.threat_level || "low"] || threatLevelBadge.low
              )}>
                {c.threat_level || "unknown"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ThreatScoreBadge({ score, level, size = "sm" }: { score: number | null; level?: string | null; size?: "sm" | "lg" }) {
  if (score === null || score === undefined) {
    return <span className="text-[10px] text-muted-foreground italic">Not scored</span>;
  }

  const color = threatScoreColor(score);

  if (size === "lg") {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-lg font-bold px-2.5 py-0.5 rounded-lg" style={{ color, background: `${color}15` }}>
          {score}/100
        </span>
        {level && (
          <span className={cn(
            "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
            threatLevelBadge[level] || threatLevelBadge.low
          )}>
            {level}
          </span>
        )}
      </div>
    );
  }

  return (
    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color, background: `${color}15` }}>
      {score}
    </span>
  );
}

export function ThreatTrendIcon({ trend }: { trend?: string | null }) {
  if (!trend) return null;
  if (trend === "increasing") return <TrendingUp className="h-3.5 w-3.5 text-[#FF4757]" />;
  if (trend === "decreasing") return <TrendingDown className="h-3.5 w-3.5 text-primary" />;
  return <ArrowRight className="h-3.5 w-3.5 text-[#FFBE0B]" />;
}
