"use client";

import { motion } from "framer-motion";

type Status =
  | "online"
  | "connected"
  | "active"
  | "degraded"
  | "reconnecting"
  | "processing"
  | "offline"
  | "disconnected"
  | "idle";

const statusConfig: Record<
  Status,
  { color: string; ringColor: string; label: string }
> = {
  online: { color: "bg-emerald-400", ringColor: "bg-emerald-400/40", label: "Online" },
  connected: { color: "bg-emerald-400", ringColor: "bg-emerald-400/40", label: "Connected" },
  active: { color: "bg-emerald-400", ringColor: "bg-emerald-400/40", label: "Active" },
  degraded: { color: "bg-amber-400", ringColor: "bg-amber-400/40", label: "Degraded" },
  reconnecting: { color: "bg-amber-400", ringColor: "bg-amber-400/40", label: "Reconnecting" },
  processing: { color: "bg-sky-400", ringColor: "bg-sky-400/40", label: "Processing" },
  idle: { color: "bg-white/40", ringColor: "bg-white/10", label: "Idle" },
  offline: { color: "bg-red-400", ringColor: "bg-red-400/40", label: "Offline" },
  disconnected: { color: "bg-red-400", ringColor: "bg-red-400/40", label: "Disconnected" },
};

export function StatusDot({ status, label }: { status: Status; label: string }) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
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
        <div className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/35">
          {label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 mt-0.5">
          {config.label}
        </span>
      </div>
    </div>
  );
}
