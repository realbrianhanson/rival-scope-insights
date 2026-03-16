import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: Array<{ name: string; value: number }>;
  color: string;
  animationDelay?: number;
}

export function Sparkline({ data, color, animationDelay = 200 }: SparklineProps) {
  if (!data || data.length === 0) return null;

  const gradientId = `sparkline-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="absolute bottom-2 right-2 w-[60%] h-[50%] opacity-100 pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={0.4}
            fill={`url(#${gradientId})`}
            animationBegin={animationDelay}
            animationDuration={800}
            animationEasing="ease-out"
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
