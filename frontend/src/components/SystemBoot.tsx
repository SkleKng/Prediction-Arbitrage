"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TextScramble } from "@/components/ui/text-scramble";
import { GlitchText } from "@/components/ui/glitch-text";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";
import { DotDistortion } from "@/components/ui/dot-distortion";
import { LiquidButton, GlassFilter } from "@/components/ui/button";

interface SystemBootProps {
  onFadeComplete: () => void;
  fadeSeconds?: number;
}

/**
 * AXIOM landing / boot screen.
 *
 * Constraints:
 *   - Locked to 100vh, overflow-hidden, no vertical scroll.
 *   - z-0: SpiralAnimation background canvas.
 *   - z-10: content grid (top status bar, center hero, CTA).
 *   - z-20: CinematicFooter band pinned to the bottom.
 *   - Hover AXIOM for the CRT glitch effect.
 */
export function SystemBoot({
  onFadeComplete,
  fadeSeconds = 0.7,
}: SystemBootProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [clock, setClock] = useState<string>("");

  // Live UTC clock in the top status bar — updates once per second.
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const hh = d.getUTCHours().toString().padStart(2, "0");
      const mm = d.getUTCMinutes().toString().padStart(2, "0");
      const ss = d.getUTCSeconds().toString().padStart(2, "0");
      return `${hh}:${mm}:${ss} UTC`;
    };
    setClock(fmt());
    const id = window.setInterval(() => setClock(fmt()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Allow pressing Enter to trigger exit — feels like a real system.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isExiting) setIsExiting(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isExiting]);

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: fadeSeconds, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (isExiting) onFadeComplete();
      }}
      className="fixed inset-0 z-[100] h-screen w-screen overflow-hidden bg-black"
      aria-hidden={isExiting}
    >
      {/* z-0: aurora / grain / vignette underlay */}
      <div className="absolute inset-0 z-0">
        <AmbientBackdrop />
      </div>

      {/* z-[1]: interactive dot field. Replaces the old SVG curves —
          the dots follow the cursor with physics-based distortion and
          pause themselves whenever nothing is moving, so the idle
          cost is essentially zero. */}
      <div className="absolute inset-0 z-[1]">
        <DotDistortion
          gap={30}
          dotSize={1.3}
          influenceRadius={130}
          pushStrength={0.26}
          returnSpeed={0.09}
          color="rgba(255,255,255,0.22)"
          highlight="rgba(220,235,255,0.55)"
        />
      </div>

      {/* HUD corner brackets — framing for the viewport */}
      <CornerBrackets />

      {/* Vertical edge labels */}
      <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180 font-mono text-[10px] uppercase tracking-[0.4em] text-white/25">
        Polymarket × Kalshi
      </div>
      <div className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 [writing-mode:vertical-rl] font-mono text-[10px] uppercase tracking-[0.4em] text-white/25">
        AI Reconciliation Layer
      </div>

      {/* Main column */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex h-full w-full flex-col"
      >
        {/* Top status bar */}
        <motion.div
          variants={item}
          className="flex items-center justify-between px-6 pt-5 md:px-10 md:pt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/50"
        >
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span>System Nominal</span>
            <span className="text-white/20">/</span>
            <span className="text-white/60">v1.0.0</span>
          </div>

          <div className="tabular-nums text-white/60 min-w-[7ch] text-right">
            {clock || "--:--:-- UTC"}
          </div>
        </motion.div>

        {/* Hero — nudged slightly upward so the CTA has real breathing room
            above the marquee / footer band. */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-28 md:pb-32 text-center">
          <motion.div
            variants={item}
            className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.45em] text-white/40"
          >
            <span className="h-px w-8 bg-white/25" />
            <span>[ Command Center ]</span>
            <span className="h-px w-8 bg-white/25" />
          </motion.div>

          <motion.div variants={item}>
            <GlitchText
              text="AXIOM"
              intensity={4}
              className="select-none font-sans font-black uppercase leading-[0.9] tracking-[-0.05em] text-white"
              style={{
                fontSize: "clamp(4.5rem, 19vw, 17rem)",
                textShadow:
                  "0 0 40px rgba(0, 255, 136, 0.18), 0 0 120px rgba(0, 0, 0, 0.7)",
              }}
            />
          </motion.div>

          <motion.div variants={item} className="mt-5 md:mt-7">
            <TextScramble
              text="CROSS-PLATFORM ARBITRAGE ENGINE"
              decorative={false}
              className="font-mono text-[10px] sm:text-xs md:text-sm tracking-[0.4em] uppercase text-white/75"
            />
          </motion.div>

          <motion.p
            variants={item}
            className="mt-3 max-w-md text-[11px] md:text-xs leading-relaxed text-white/40 font-mono tracking-wide"
          >
            Real-time detection of pricing dislocations across prediction
            markets, reconciled by a dedicated AI matching layer.
          </motion.p>

          {/* CTA — LiquidButton. Uses an SVG displacement filter so the
              pixels behind the pill (aurora + dots) refract through the
              glass as you pass over it. The SVG filter is mounted once
              at the root of SystemBoot (see <GlassFilter />). */}
          <motion.div variants={item} className="mt-10 md:mt-14">
            <LiquidButton
              type="button"
              onClick={() => setIsExiting(true)}
              disabled={isExiting}
              aria-label="Enter AXIOM command center"
              withFilter={false}
              className="group h-auto gap-5 rounded-full py-4 px-10 font-mono text-xs sm:text-sm tracking-[0.35em] uppercase text-white/85 hover:text-white disabled:opacity-40"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>

              <GlitchText
                text="ENTER SYSTEM"
                intensity={2}
                className="relative"
              />

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </LiquidButton>
          </motion.div>

          {/* Hint — darkened backing pill so the text reads cleanly
              against the interactive dot grid behind it. */}
          <motion.div
            variants={item}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.35em] text-white/55 shadow-[0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-[2px]"
          >
            <span>Press</span>
            <kbd className="inline-flex h-[18px] items-center rounded-[3px] border border-white/20 bg-white/5 px-1.5 font-mono text-[9px] tracking-[0.2em] text-white/80 shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
              Enter
            </kbd>
            <span>or click to initialize</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer band pinned to the bottom of this 100vh view */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto">
        <CinematicFooter band />
      </div>

      {/* Single shared SVG filter for LiquidButton. Must only exist
          once per page — see button.tsx for details. */}
      <GlassFilter />
    </motion.div>
  );
}

/** Thin L-shaped brackets in each corner to frame the view like a HUD. */
function CornerBrackets() {
  const common = "absolute z-10 h-5 w-5 border-white/30";
  return (
    <>
      <span
        className={`${common} top-3 left-3 border-t border-l`}
        aria-hidden
      />
      <span
        className={`${common} top-3 right-3 border-t border-r`}
        aria-hidden
      />
      <span
        className={`${common} bottom-3 left-3 border-b border-l`}
        aria-hidden
      />
      <span
        className={`${common} bottom-3 right-3 border-b border-r`}
        aria-hidden
      />
    </>
  );
}
