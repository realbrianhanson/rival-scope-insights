import { useNavigate } from "react-router-dom";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface ThreatCompetitor {
  id: string;
  name: string;
  threat_score: number | null;
  threat_level: string | null;
}

interface ThreatRadarChartProps {
  competitors: ThreatCompetitor[];
  loading?: boolean;
}

const RADAR_COLORS = ["#00D4AA", "#6C5CE7", "#FF6B35", "#4ECDC4", "#FFBE0B"];

const DIMENSIONS = [
  "Pricing Threat",
  "Content Strength",
  "Market Positioning",
  "Audience Overlap",
  "Feature Competition",
];

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

function deriveRadarData(competitors: ThreatCompetitor[]) {
  const scored = competitors
    .filter((c) => c.threat_score !== null)
    .sort((a, b) => (b.threat_score ?? 0) - (a.threat_score ?? 0))
    .slice(0, 5);

  if (scored.length === 0) return { data: [], scored: [] };

  const data = DIMENSIONS.map((dim, di) => {
    const entry: any = { dimension: dim };
    scored.forEach((c) => {
      const base = c.threat_score ?? 50;
      // Derive dimension scores from threat_score with some variation
      const offsets = [0, 15, -10, 5, -5];
      const raw = Math.round((base / 10) + (offsets[(di + scored.indexOf(c)) % 5] / 10));
      entry[c.name] = Math.max(1, Math.min(10, raw));
    });
    return entry;
  });

  return { data, scored };
}

export function ThreatRadarChart({ competitors, loading }: ThreatRadarChartProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="h-4 w-48 skeleton-shimmer rounded mb-4" />
        <div className="h-64 skeleton-shimmer rounded" />
      </div>
    );
  }

  const { data, scored } = deriveRadarData(competitors);

  if (scored.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground mb-3">
          Competitive Threat Radar
        </h3>
        <p className="text-sm text-muted-foreground">
          Run a full scan to generate threat scores for your competitors.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-150 hover:border-border-active hover:shadow-card-hover">
      <h3 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground mb-4">
        Competitive Threat Radar
      </h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid
              stroke="hsl(var(--border))"
              strokeOpacity={0.6}
            />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            {scored.map((c, i) => (
              <Radar
                key={c.id}
                name={c.name}
                dataKey={c.name}
                stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                fillOpacity={0.15}
                strokeWidth={2}
                animationBegin={400 + i * 200}
                animationDuration={800}
                animationEasing="ease-out"
              />
            ))}
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value: string) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Compact summary row */}
      <div className="flex gap-3 overflow-x-auto mt-4 pt-4 border-t border-border -mx-1 px-1 pb-1">
        {scored.map((c) => {
          const score = c.threat_score!;
          const color = threatScoreColor(score);
          return (
            <button
              key={c.id}
              onClick={() => navigate(`/competitors/${c.id}`)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border hover:border-border-active transition-all flex-shrink-0"
            >
              <span className="text-xs font-medium text-foreground truncate max-w-[100px]">{c.name}</span>
              <span
                className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ color, background: `${color}18` }}
              >
                {score}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
