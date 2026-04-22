"use client";

import { useEffect, useRef } from "react";

export function DotDistortionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const dots: { x: number; y: number; baseX: number; baseY: number }[] = [];
    const spacing = 16; // Space between dots
    const radius = 150; // Radius of mouse influence
    const strength = 30; // How far dots are pushed

    const initDots = () => {
      dots.length = 0;
      // Add some padding so dots don't pop in at the edges
      for (let x = -spacing; x < width + spacing; x += spacing) {
        for (let y = -spacing; y < height + spacing; y += spacing) {
          dots.push({ x, y, baseX: x, baseY: y });
        }
      }
    };

    initDots();

    let mouse = { x: -1000, y: -1000 };
    let targetMouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.x = e.clientX;
      targetMouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      targetMouse.x = -1000;
      targetMouse.y = -1000;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initDots();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (targetMouse.x - mouse.x) * 0.1;
      mouse.y += (targetMouse.y - mouse.y) * 0.1;

      // Use the cyan color from the AXIOM theme
      ctx.fillStyle = "rgba(0, 240, 255, 0.5)";

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = mouse.x - dot.baseX;
        const dy = mouse.y - dot.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = dot.baseX;
        let targetY = dot.baseY;

        if (dist < radius) {
          // Calculate push force (closer = stronger push)
          const force = Math.pow((radius - dist) / radius, 1.5);
          
          // Push dots away from mouse
          if (dist > 0) {
            targetX = dot.baseX - (dx / dist) * force * strength;
            targetY = dot.baseY - (dy / dist) * force * strength;
          }
        }

        // Spring physics to return to base or move to target
        dot.x += (targetX - dot.x) * 0.15;
        dot.y += (targetY - dot.y) * 0.15;

        // Draw dot
        ctx.beginPath();
        // Make dots slightly larger when distorted
        const dotSize = dist < radius ? 1.0 + ((radius - dist) / radius) * 1 : 1.0;
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}
