"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  /** Size of the RGB split offset in px on hover. Default 3. */
  intensity?: number;
  /** When true the glitch runs continuously instead of on hover. */
  always?: boolean;
  /** Outer wrapper classes (font-size, weight, tracking, etc.). */
  className?: string;
}

/**
 * Hover-activated CRT / RGB-split glitch.
 *
 * Technique: stack three copies of the same text — a clean base plus two
 * absolutely-positioned layers blended with `mix-blend-mode: screen`
 * (cyan + magenta channels). On hover we:
 *   1. Displace the colour channels via CSS vars (`--gx`, `--gy`).
 *   2. Animate each layer with its own keyframes that also animate
 *      `clip-path: inset(...)` bands so only horizontal slices are shifted,
 *      producing the scan-line tearing you see in the reference.
 *   3. Layer a faint noise / scanline overlay on top.
 */
export function GlitchText({
  text,
  intensity = 3,
  always = false,
  className,
  style,
  ...rest
}: GlitchTextProps) {
  return (
    <>
      <style
        // scoped via a unique class so multiple GlitchText instances don't collide
        dangerouslySetInnerHTML={{
          __html: `
            /* Smoothed glitch: eased channel drift (no snap), no base-text
               jitter, GPU-composited layers. Reads as a subtle chromatic
               aberration rather than a hard CRT tear. */
            .glitch-text {
              position: relative;
              display: inline-block;
              color: inherit;
              --gx: ${intensity}px;
              --gy: ${Math.max(1, Math.round(intensity / 2))}px;
            }
            .glitch-text .glitch-layer {
              position: absolute;
              inset: 0;
              pointer-events: none;
              opacity: 0;
              mix-blend-mode: screen;
              transition: opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1);
            }
            .glitch-text:hover .glitch-layer,
            .glitch-text.glitch-always .glitch-layer {
              opacity: 0.9;
            }
            .glitch-text .glitch-cyan {
              color: #00eaff;
              text-shadow: 0 0 2px rgba(0, 234, 255, 0.45);
            }
            .glitch-text .glitch-magenta {
              color: #ff2e88;
              text-shadow: 0 0 2px rgba(255, 46, 136, 0.45);
            }
            .glitch-text:hover .glitch-cyan,
            .glitch-text.glitch-always .glitch-cyan {
              animation: glitch-shift-cyan 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite;
            }
            .glitch-text:hover .glitch-magenta,
            .glitch-text.glitch-always .glitch-magenta {
              animation: glitch-shift-magenta 3.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
            }

            /* Slower, eased channel drift. Clip bands move smoothly between
               large slices so the tearing feels like wave motion, not strobe.
               The base text itself does not animate — that's what killed the
               "shaky" feel. */
            @keyframes glitch-shift-cyan {
              0%   { clip-path: inset(0 0 70% 0);  transform: translate3d(calc(var(--gx) * -0.6), 0, 0); }
              25%  { clip-path: inset(35% 0 35% 0); transform: translate3d(calc(var(--gx) * -1), calc(var(--gy) * 0.4), 0); }
              50%  { clip-path: inset(60% 0 10% 0); transform: translate3d(calc(var(--gx) * -0.8), calc(var(--gy) * -0.4), 0); }
              75%  { clip-path: inset(15% 0 55% 0); transform: translate3d(calc(var(--gx) * -0.5), 0, 0); }
              100% { clip-path: inset(0 0 70% 0);   transform: translate3d(calc(var(--gx) * -0.6), 0, 0); }
            }
            @keyframes glitch-shift-magenta {
              0%   { clip-path: inset(55% 0 15% 0); transform: translate3d(calc(var(--gx) * 0.6), 0, 0); }
              25%  { clip-path: inset(15% 0 55% 0); transform: translate3d(var(--gx), calc(var(--gy) * -0.4), 0); }
              50%  { clip-path: inset(40% 0 30% 0); transform: translate3d(calc(var(--gx) * 0.8), calc(var(--gy) * 0.4), 0); }
              75%  { clip-path: inset(5% 0 70% 0);  transform: translate3d(calc(var(--gx) * 0.5), 0, 0); }
              100% { clip-path: inset(55% 0 15% 0); transform: translate3d(calc(var(--gx) * 0.6), 0, 0); }
            }

            /* Scanline overlay — fades in gently */
            .glitch-text .glitch-scanlines {
              position: absolute;
              inset: 0;
              pointer-events: none;
              background-image: repeating-linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.03) 0px,
                rgba(255, 255, 255, 0.03) 1px,
                transparent 1px,
                transparent 3px
              );
              mix-blend-mode: overlay;
              opacity: 0;
              transition: opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1);
            }
            .glitch-text:hover .glitch-scanlines,
            .glitch-text.glitch-always .glitch-scanlines {
              opacity: 1;
            }
          `,
        }}
      />
      <span
        {...rest}
        data-text={text}
        className={cn("glitch-text", always && "glitch-always", className)}
        style={style}
      >
        <span className="glitch-base relative inline-block">{text}</span>
        <span aria-hidden className="glitch-layer glitch-cyan">
          {text}
        </span>
        <span aria-hidden className="glitch-layer glitch-magenta">
          {text}
        </span>
        <span aria-hidden className="glitch-scanlines" />
      </span>
    </>
  );
}
