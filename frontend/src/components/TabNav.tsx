"use client";

import { motion } from "framer-motion";

export type TabId = "dashboard" | "feed" | "ai";

const tabs: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "feed", label: "Live Feed" },
  { id: "ai", label: "AI Engine" },
];

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

/**
 * Typographic tab nav — no icons, no pills. Matches the landing's
 * bracketed mono-caps language. Active tab is marked by a thin rule
 * underneath (layoutId animated) and a brighter label color.
 */
export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="group relative px-4 py-2 font-mono text-[10px] uppercase tracking-[0.35em] transition-colors"
          >
            <span
              className={`relative z-10 flex items-center gap-2 transition-colors duration-200 ${
                isActive ? "text-white" : "text-white/40 group-hover:text-white/70"
              }`}
            >
              <span
                className={`transition-colors duration-200 ${
                  isActive ? "text-emerald-400" : "text-white/20"
                }`}
              >
                [
              </span>
              <span>{tab.label}</span>
              <span
                className={`transition-colors duration-200 ${
                  isActive ? "text-emerald-400" : "text-white/20"
                }`}
              >
                ]
              </span>
            </span>

            {isActive && (
              <motion.span
                layoutId="activeTabUnderline"
                className="absolute left-3 right-3 -bottom-[1px] h-px bg-emerald-400/70"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
