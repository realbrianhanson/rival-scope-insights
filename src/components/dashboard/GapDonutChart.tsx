import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface GapDonutChartProps {
  distribution: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  feature: "#00D4AA",
  content: "#6C5CE7",
  pricing: "#FF6B35",
  positioning: "#FFBE0B",
  audience: "#4ECDC4",
};

export function GapDonutChart({ distribution }: GapDonutChartProps) {
  const entries = Object.entries(distribution).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;

  const total = entries.reduce((s, [, v]) => s + v, 0);
  const data = entries.map(([name, value]) => ({ name, value }));

  return (
    <div className="mt-5 pt-5 border-t border-border">
      <div className="flex items-center gap-4">
        <div className="w-[120px] h-[120px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                animationBegin={600}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] || "hsl(var(--muted-foreground))"}
                  />
                ))}
              </Pie>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-foreground"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700 }}
              >
                {total}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-1.5">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: CATEGORY_COLORS[entry.name] || "hsl(var(--muted-foreground))" }}
              />
              <span className="text-xs text-muted-foreground capitalize">{entry.name}</span>
              <span className="text-xs font-mono font-medium text-foreground ml-auto">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
