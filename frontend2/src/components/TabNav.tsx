"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Radio, Brain } from "lucide-react";

export type TabId = "dashboard" | "feed" | "ai";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "feed", label: "Live Feed", icon: Radio },
  { id: "ai", label: "AI Engine", icon: Brain },
];

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors duration-200"
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/[0.1]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <tab.icon
              className={`relative z-10 w-3.5 h-3.5 transition-colors duration-200 ${
                isActive ? "text-neon-green" : "text-white/30"
              }`}
            />
            <span
              className={`relative z-10 font-mono text-xs tracking-wide transition-colors duration-200 ${
                isActive ? "text-white/90" : "text-white/40"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
