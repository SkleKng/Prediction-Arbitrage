"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { ArbitrageCard } from "./ArbitrageCard";
import type { ArbitrageOpportunity } from "@/types/market";

type SortField = "spread" | "matchScore" | "volume";
type FilterPreset = "all" | "profitable" | "hot";

interface ArbitrageFeedProps {
  opportunities: ArbitrageOpportunity[];
  compact?: boolean;
}

export function ArbitrageFeed({ opportunities, compact = false }: ArbitrageFeedProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("spread");
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState<FilterPreset>("all");

  const filtered = useMemo(() => {
    let items = [...opportunities];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (o) =>
          o.polymarket.title.toLowerCase().includes(q) ||
          o.kalshi.title.toLowerCase().includes(q) ||
          o.kalshi.ticker.toLowerCase().includes(q)
      );
    }

    // Preset filter
    if (filter === "profitable") {
      items = items.filter((o) => o.spread > 0);
    } else if (filter === "hot") {
      items = items.filter((o) => o.spread >= 2);
    }

    // Sort
    items.sort((a, b) => {
      let va = 0, vb = 0;
      if (sortField === "spread") { va = a.spread; vb = b.spread; }
      else if (sortField === "matchScore") { va = a.matchScore; vb = b.matchScore; }
      else if (sortField === "volume") { va = a.polymarket.volumeNum; vb = b.polymarket.volumeNum; }
      return sortAsc ? va - vb : vb - va;
    });

    return items;
  }, [opportunities, search, sortField, sortAsc, filter]);

  const hotCount = opportunities.filter((o) => o.spread >= 2).length;
  const profitableCount = opportunities.filter((o) => o.spread > 0).length;

  return (
    <div className="space-y-4">
      {!compact && (
        <>
          {/* Feed header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <h2 className="text-lg font-bold text-white/95 tracking-tight uppercase">
                  AXIOM Order Book
                </h2>
              </div>
              <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 px-2 py-1 rounded-md border border-neon-blue/20">
                {filtered.length} ACTIVE PAIRS
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search markets, tickers..."
                className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/[0.1] rounded-sm text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-neon-blue/30 transition-colors"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5">
              <FilterPill
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label="All"
                count={opportunities.length}
              />
              <FilterPill
                active={filter === "profitable"}
                onClick={() => setFilter("profitable")}
                label="Profitable"
                count={profitableCount}
                color="text-neon-green"
              />
              <FilterPill
                active={filter === "hot"}
                onClick={() => setFilter("hot")}
                label="Hot"
                count={hotCount}
                color="text-neon-yellow"
              />
            </div>

            <div className="h-6 w-px bg-white/10" />

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-white/30" />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="bg-transparent text-xs font-mono text-white/60 border-none focus:outline-none cursor-pointer"
              >
                <option value="spread">Spread</option>
                <option value="matchScore">AI Score</option>
                <option value="volume">Volume</option>
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="p-1 rounded hover:bg-white/5 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-white/30" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cards */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((opp, idx) => (
            <ArbitrageCard key={opp.id} opportunity={opp} index={idx} />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-white/30 text-sm font-mono">
              No opportunities match your filters
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  color = "text-white/60",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-mono uppercase tracking-wider transition-all ${
        active
          ? "bg-white/[0.08] border border-white/[0.2] text-white/80"
          : "bg-white/[0.02] border border-white/5 text-white/40 hover:bg-white/[0.04]"
      }`}
    >
      <span>{label}</span>
      <span className={`${active ? color : "text-white/30"}`}>{count}</span>
    </button>
  );
}
