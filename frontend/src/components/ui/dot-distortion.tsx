"use client";

import { memo, useEffect, useRef } from "react";

/**
 * Interactive dot-grid background. Draws a field of dots on a single
 * <canvas>. When the cursor moves close to a dot, the dot is pushed
 * away from the cursor; it then springs back to its home position.
 * Individual dots randomly twinkle.
 *
 * Perf discipline (important — this component is full-viewport):
 *
 *   1. One 2D canvas, dpr clamped to 1.5 so we don't quadruple pixel
 *      work on 3x Retina displays. Dots at this scale still look crisp.
 *   2. The RAF loop short-circuits when (a) the cursor is parked AND
 *      every dot is within epsilon of its home, AND (b) no twinkle is
 *      active. In practice the loop spends >80% of the session
 *      skipping work.
 *   3. Cursor position is tracked in a ref — zero React re-renders
 *      from mousemove.
 *   4. Pauses when the document is hidden or when the canvas is
 *      scrolled off-screen (IntersectionObserver).
 *   5. Honors `prefers-reduced-motion` by drawing a static grid.
 */

interface DotDistortionProps {
  /** Grid spacing in CSS px. Bigger gap = fewer dots = cheaper. */
  gap?: number;
  /** Dot radius in CSS px. */
  dotSize?: number;
  /** How far the cursor "feels" around itself, in CSS px. */
  influenceRadius?: number;
  /** How hard the cursor pushes dots (0..1 typical). */
  pushStrength?: number;
  /** Spring stiffness pulling dots back to home (0..1). Higher = snappier. */
  returnSpeed?: number;
  /** Base dot color — any rgba() / hex. */
  color?: string;
  /** Glow tint when a dot twinkles or is displaced. */
  highlight?: string;
  className?: string;
}

interface Dot {
  hx: number; // home x
  hy: number; // home y
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0..1, extra glow on top of base brightness. */
  glow: number;
  /** Frames until next twinkle. Counted down each frame. */
  twinkleIn: number;
}

export const DotDistortion = memo(function DotDistortion({
  gap = 28,
  dotSize = 1.3,
  influenceRadius = 120,
  pushStrength = 0.22,
  returnSpeed = 0.08,
  color = "rgba(255,255,255,0.28)",
  highlight = "rgba(0,255,136,0.9)",
  className,
}: DotDistortionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // All live state lives in refs — no re-renders from animation.
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const layoutDots = () => {
      // Clamp DPR. 1.5 is the sweet spot — visually indistinguishable
      // from 2x/3x for 1–2px dots but ~2–4x cheaper per frame.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = wrapper.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      sizeRef.current = { w, h, dpr };

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Build grid. Offset so columns/rows are centered in the viewport.
      const cols = Math.floor(w / gap);
      const rows = Math.floor(h / gap);
      const offX = (w - (cols - 1) * gap) / 2;
      const offY = (h - (rows - 1) * gap) / 2;

      const dots: Dot[] = new Array(cols * rows);
      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offX + c * gap;
          const y = offY + r * gap;
          dots[i++] = {
            hx: x,
            hy: y,
            x,
            y,
            vx: 0,
            vy: 0,
            glow: 0,
            twinkleIn: 60 + Math.floor(Math.random() * 600),
          };
        }
      }
      dotsRef.current = dots;
    };

    layoutDots();

    // Parse the base color once so we can tint twinkles cheaply.
    // We just re-use the highlight as a second fill + globalAlpha.
    const drawStatic = () => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (const d of dotsRef.current) {
        ctx.beginPath();
        ctx.arc(d.hx, d.hy, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (reduced) {
      drawStatic();
      return () => {};
    }

    const influence2 = influenceRadius * influenceRadius;
    const EPS = 0.02; // velocity/displacement below this is considered "settled"

    const frame = () => {
      rafRef.current = null;
      if (!visibleRef.current) return;

      const dots = dotsRef.current;
      const { w, h } = sizeRef.current;
      const mouse = mouseRef.current;
      const mx = mouse.x;
      const my = mouse.y;
      const mouseActive = mouse.active;

      let anyMotion = false;

      ctx.clearRect(0, 0, w, h);

      // Single pass: physics + draw.
      for (let i = 0, len = dots.length; i < len; i++) {
        const d = dots[i];

        // 1. Cursor push
        if (mouseActive) {
          const dx = d.x - mx;
          const dy = d.y - my;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < influence2 && dist2 > 0.01) {
            const dist = Math.sqrt(dist2);
            // Falloff: 1 at cursor, 0 at radius.
            const falloff = 1 - dist / influenceRadius;
            const force = falloff * falloff * pushStrength * 6;
            d.vx += (dx / dist) * force;
            d.vy += (dy / dist) * force;
          }
        }

        // 2. Spring back to home
        d.vx += (d.hx - d.x) * returnSpeed;
        d.vy += (d.hy - d.y) * returnSpeed;

        // 3. Damping
        d.vx *= 0.82;
        d.vy *= 0.82;

        // 4. Integrate
        d.x += d.vx;
        d.y += d.vy;

        // 5. Twinkle — soft, infrequent. Peak glow is capped well below
        //    1 and decays slowly so it reads as a breathing dot rather
        //    than a flash. Gaps between twinkles are long (~8–30s per
        //    dot on average at 60fps).
        if (d.twinkleIn <= 0) {
          d.glow = 0.35 + Math.random() * 0.15;
          d.twinkleIn = 500 + Math.floor(Math.random() * 1800);
        } else {
          d.twinkleIn--;
          if (d.glow > 0) d.glow *= 0.97;
        }

        // 6. Draw
        const dispSq =
          (d.x - d.hx) * (d.x - d.hx) + (d.y - d.hy) * (d.y - d.hy);
        const isMoving =
          Math.abs(d.vx) > EPS ||
          Math.abs(d.vy) > EPS ||
          dispSq > EPS ||
          d.glow > 0.05;
        if (isMoving) anyMotion = true;

        // Base dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, dotSize, 0, Math.PI * 2);
        ctx.fill();

        // Glow overlay — skipped for idle dots. Kept subtle: same radius
        //    as the base dot (no halo) so twinkling reads as a gentle
        //    brightness shift, not a pop.
        if (d.glow > 0.05) {
          ctx.fillStyle = highlight;
          ctx.globalAlpha = d.glow * 0.6;
          ctx.beginPath();
          ctx.arc(d.x, d.y, dotSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Only keep the RAF alive if something is still in motion OR the
      // cursor is currently over the canvas. Parked & settled = we stop
      // scheduling frames entirely. This is the single biggest perf
      // lever — lets the CPU idle when nothing is happening.
      if (anyMotion || mouseActive) {
        rafRef.current = requestAnimationFrame(frame);
      }
    };

    const kick = () => {
      if (rafRef.current == null && visibleRef.current) {
        rafRef.current = requestAnimationFrame(frame);
      }
    };

    // Kick once so twinkles start and initial paint happens.
    kick();

    // Cursor tracking — no React state. We mark the cursor "inactive"
    // when it hasn't moved for a beat so the RAF loop can idle out.
    let idleTimer: number | null = null;
    const onMove = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
      if (idleTimer != null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        mouseRef.current.active = false;
      }, 180);
      kick();
    };
    const onBlur = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onBlur);

    // Resize
    let resizeScheduled = false;
    const onResize = () => {
      if (resizeScheduled) return;
      resizeScheduled = true;
      requestAnimationFrame(() => {
        resizeScheduled = false;
        layoutDots();
        kick();
      });
    };
    window.addEventListener("resize", onResize);

    // Visibility — pause when tab hidden.
    const onVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (visibleRef.current) kick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // IntersectionObserver — pause when scrolled off-screen.
    const io = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries[0]?.isIntersecting ?? true;
        if (visibleRef.current) kick();
      },
      { threshold: 0 }
    );
    io.observe(wrapper);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (idleTimer != null) window.clearTimeout(idleTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
    };
  }, [
    gap,
    dotSize,
    influenceRadius,
    pushStrength,
    returnSpeed,
    color,
    highlight,
  ]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
});
