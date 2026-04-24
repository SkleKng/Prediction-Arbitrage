"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { PricePoint } from "@/types/market";

interface SpreadChartProps {
  data: PricePoint[];
}

export function SpreadChart({ data }: SpreadChartProps) {
  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientPoly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00b4ff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00b4ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientKalshi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffcc00" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ffcc00" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientSpread" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff88" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            horizontal
            vertical={false}
          />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(t) => {
              const d = new Date(t);
              return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
            }}
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toFixed(2)}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />

          <Area
            type="monotone"
            dataKey="polyYes"
            stroke="#00b4ff"
            strokeWidth={2}
            fill="url(#gradientPoly)"
            dot={false}
            activeDot={{ r: 4, fill: "#00b4ff", stroke: "#0a0a0f", strokeWidth: 2 }}
          />

          <Area
            type="monotone"
            dataKey="kalshiYes"
            stroke="#ffcc00"
            strokeWidth={2}
            fill="url(#gradientKalshi)"
            dot={false}
            activeDot={{ r: 4, fill: "#ffcc00", stroke: "#0a0a0f", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: number;
}) {
  if (!active || !payload || !label) return null;

  const time = new Date(label).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const polyVal = payload.find((p) => p.dataKey === "polyYes")?.value ?? 0;
  const kalshiVal = payload.find((p) => p.dataKey === "kalshiYes")?.value ?? 0;
  const spread = ((kalshiVal - polyVal) * 100).toFixed(2);

  return (
    <div className="glass rounded-lg px-3 py-2 text-xs font-mono border border-white/10">
      <div className="text-white/40 mb-1">{time}</div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00b4ff]" />
        <span className="text-white/60">Poly YES:</span>
        <span className="text-[#00b4ff]">{polyVal.toFixed(4)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#ffcc00]" />
        <span className="text-white/60">Kalshi YES:</span>
        <span className="text-[#ffcc00]">{kalshiVal.toFixed(4)}</span>
      </div>
      <div className="flex items-center gap-2 pt-1 mt-1 border-t border-white/10">
        <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
        <span className="text-white/60">Spread:</span>
        <span className="text-[#00ff88]">{spread}%</span>
      </div>
    </div>
  );
}
