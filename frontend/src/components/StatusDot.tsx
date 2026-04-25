"use client";

import { motion } from "framer-motion";

type Status = "online" | "connected" | "active" | "degraded" | "reconnecting" | "processing" | "offline" | "disconnected" | "idle";

const statusConfig: Record<Status, { color: string; ringColor: string; label: string }> = {
  online: { color: "bg-neon-green", ringColor: "bg-neon-green/30", label: "Online" },
  connected: { color: "bg-neon-green", ringColor: "bg-neon-green/30", label: "Connected" },
  active: { color: "bg-neon-green", ringColor: "bg-neon-green/30", label: "Active" },
  degraded: { color: "bg-neon-yellow", ringColor: "bg-neon-yellow/30", label: "Degraded" },
  reconnecting: { color: "bg-neon-yellow", ringColor: "bg-neon-yellow/30", label: "Reconnecting" },
  processing: { color: "bg-neon-blue", ringColor: "bg-neon-blue/30", label: "Processing" },
  idle: { color: "bg-white/40", ringColor: "bg-white/10", label: "Idle" },
  offline: { color: "bg-neon-red", ringColor: "bg-neon-red/30", label: "Offline" },
  disconnected: { color: "bg-neon-red", ringColor: "bg-neon-red/30", label: "Disconnected" },
};

export function StatusDot({ status, label }: { status: Status; label: string }) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring */}
        <motion.div
          className={`absolute w-3 h-3 rounded-full ${config.ringColor}`}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Core dot */}
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-white/40 leading-none">
          {label}
        </span>
        <span className="text-xs font-mono text-white/70 leading-tight">
          {config.label}
        </span>
      </div>
    </div>
  );
}
