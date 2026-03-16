import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface ActivityTimelineProps {
  data: Array<{
    day: string;
    date: string;
    scrapes: number;
    reports: number;
    gaps: number;
    alerts: number;
  }>;
  loading?: boolean;
}

const COLORS = {
  scrapes: "#4ECDC4",
  reports: "#6C5CE7",
  gaps: "#00D4AA",
  alerts: "#FF6B35",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-muted-foreground capitalize">{p.dataKey}</span>
          <span className="font-mono font-medium text-foreground ml-auto">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ActivityTimeline({ data, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 h-full">
        <div className="h-5 w-36 skeleton-shimmer rounded mb-6" />
        <div className="h-40 skeleton-shimmer rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-full transition-all duration-150 hover:border-border-active hover:shadow-card-hover">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">14-Day Activity</h3>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No activity recorded yet</p>
        </div>
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -4, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                interval={1}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
              <Bar
                dataKey="scrapes"
                stackId="a"
                fill={COLORS.scrapes}
                radius={[0, 0, 0, 0]}
                animationBegin={800}
                animationDuration={800}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="reports"
                stackId="a"
                fill={COLORS.reports}
                radius={[0, 0, 0, 0]}
                animationBegin={800}
                animationDuration={800}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="gaps"
                stackId="a"
                fill={COLORS.gaps}
                radius={[0, 0, 0, 0]}
                animationBegin={800}
                animationDuration={800}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="alerts"
                stackId="a"
                fill={COLORS.alerts}
                radius={[2, 2, 0, 0]}
                animationBegin={800}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {Object.entries(COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[11px] text-muted-foreground capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
