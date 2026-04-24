"use client";

import { memo } from "react";

/**
 * Premium "expensive black" background — GPU-cheap version.
 *
 * PERF NOTES (post-optimization):
 *   - Orbs shrunk 70vw → 45vw and blur 40px → 22px. This cuts the
 *     offscreen blur-texture area to ~1/4, which is by far the biggest
 *     factor in backdrop cost on Retina displays.
 *   - `will-change: transform` removed. It was forcing three permanent
 *     full-viewport compositor layers. The CSS animations still run
 *     on the compositor thread without it for simple transforms.
 *   - Purple accent orb removed (it was the least visible and still
 *     cost a full-screen blur).
 *   - Fractal-noise SVG baseFrequency bumped from 0.9 → 0.65 so the
 *     browser rasterizes a smaller, cheaper texture.
 *
 * Visual output is effectively identical — the orbs are still clearly
 * visible, just not sized to melt the GPU.
 */
export const AmbientBackdrop = memo(function AmbientBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes aurora-drift-a {
              0%   { transform: translate3d(0, 0, 0); }
              33%  { transform: translate3d(30px, -20px, 0); }
              66%  { transform: translate3d(-15px, 15px, 0); }
              100% { transform: translate3d(0, 0, 0); }
            }
            @keyframes aurora-drift-b {
              0%   { transform: translate3d(0, 0, 0); }
              33%  { transform: translate3d(-20px, 18px, 0); }
              66%  { transform: translate3d(15px, -10px, 0); }
              100% { transform: translate3d(0, 0, 0); }
            }
            .aurora-a {
              animation: aurora-drift-a 30s ease-in-out infinite;
            }
            .aurora-b {
              animation: aurora-drift-b 34s ease-in-out infinite;
            }
          `,
        }}
      />

      {/* 1. Deep obsidian base (not pure black) */}
      <div className="absolute inset-0 bg-[#05060a]" />

      {/* 2a. Drifting green aurora — bottom-left */}
      <div
        aria-hidden
        className="aurora-a absolute rounded-full"
        style={{
          width: "45vw",
          height: "45vw",
          left: "-10vw",
          bottom: "-15vw",
          background:
            "radial-gradient(circle, rgba(0,255,136,0.22) 0%, rgba(0,255,136,0.07) 35%, transparent 70%)",
          filter: "blur(22px)",
        }}
      />

      {/* 2b. Drifting blue aurora — top-right */}
      <div
        aria-hidden
        className="aurora-b absolute rounded-full"
        style={{
          width: "42vw",
          height: "42vw",
          right: "-8vw",
          top: "-12vw",
          background:
            "radial-gradient(circle, rgba(0,180,255,0.2) 0%, rgba(0,180,255,0.06) 40%, transparent 70%)",
          filter: "blur(22px)",
        }}
      />

      {/* 3. Micro-grid — almost invisible but adds rigor */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* 4. Fractal noise — kills banding. Lower baseFrequency = cheaper
             to rasterize and still plenty of grain. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='1'/></svg>\")",
          backgroundSize: "200px 200px",
        }}
      />

      {/* 5. Edge vignette for legibility */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
});
