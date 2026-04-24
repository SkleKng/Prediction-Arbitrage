import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { ArbitrageOpportunity } from "@/types/market";
import { generatePriceHistory } from "@/data/mock";

// Dynamically import the heavy recharts component
const SpreadChart = dynamic(
  () => import("./SpreadChart").then((mod) => mod.SpreadChart),
  { ssr: false, loading: () => <div className="w-full h-[220px] animate-pulse bg-white/5 rounded-xl" /> }
);

interface ArbitrageCardDetailsProps {
  opportunity: ArbitrageOpportunity;
}

export function ArbitrageCardDetails({ opportunity }: ArbitrageCardDetailsProps) {
  const polyYes = opportunity.polyPrice?.yes_ask ?? 0;
  const kalshiYes = opportunity.kalshiPrice?.yes_ask ?? 0;
  const history = generatePriceHistory(polyYes, kalshiYes);

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-3 font-mono">
            Price Convergence (24h)
          </h3>
          <SpreadChart data={history} />
        </div>

        {/* Details panel */}
        <div className="space-y-4">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-mono">
            Market Details
          </h3>

          <div className="space-y-3">
            <DetailRow
              label="Direction"
              value={
                opportunity.direction === "poly_yes_kalshi_no"
                  ? "Buy Poly YES + Kalshi NO"
                  : opportunity.direction === "kalshi_yes_poly_no"
                  ? "Buy Kalshi YES + Poly NO"
                  : "No arbitrage"
              }
            />
            <DetailRow
              label="Poly Liquidity"
              value={`$${parseFloat(opportunity.polymarket.liquidity).toLocaleString()}`}
            />
            <DetailRow
              label="Kalshi Volume"
              value={`$${parseFloat(opportunity.kalshi.volume_fp).toLocaleString()}`}
            />
            <DetailRow
              label="Poly End"
              value={new Date(opportunity.polymarket.end_date).toLocaleDateString()}
            />
            <DetailRow
              label="Kalshi Close"
              value={new Date(opportunity.kalshi.close_time).toLocaleDateString()}
            />
            <DetailRow
              label="AI Score"
              value={`${(opportunity.matchScore * 100).toFixed(1)}%`}
              highlight
            />
          </div>

          {/* Action hint */}
          <div
            className={cn(
              "rounded-lg p-3 text-center text-xs font-mono",
              opportunity.spread >= 2
                ? "bg-neon-green/5 border border-neon-green/20 text-neon-green"
                : "bg-white/5 border border-white/10 text-white/40"
            )}
          >
            {opportunity.spread >= 2
              ? "ACTIONABLE SPREAD DETECTED"
              : "Monitoring spread convergence..."}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-white/40 font-mono">{label}</span>
      <span
        className={cn(
          "text-[11px] font-mono tabular-nums",
          highlight ? "text-neon-purple font-semibold" : "text-white/70"
        )}
      >
        {value}
      </span>
    </div>
  );
}