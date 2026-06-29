"use client";

import { useEffect, useRef } from "react";

export function Backdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 34 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.4,
      s: Math.random() * 0.00018 + 0.00006,
    }));

    const glows = [
      { x: 0.18, y: 0.22, hue: "236, 168, 214", base: 360 },
      { x: 0.82, y: 0.65, hue: "167, 139, 250", base: 320 },
    ];

    const GRID = 46;
    let t = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      glows.forEach((g, i) => {
        const cx = (g.x + Math.sin(t * 0.06 + i * 2) * 0.04) * w;
        const cy = (g.y + Math.cos(t * 0.05 + i) * 0.04) * h;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, g.base);
        grad.addColorStop(0, `rgba(${g.hue}, 0.06)`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });

      const offset = (t * 6) % GRID;
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -offset; x <= w; x += GRID) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = -offset; y <= h; y += GRID) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      particles.forEach((p) => {
        p.y -= p.s;
        if (p.y < -0.02) {
          p.y = 1.02;
          p.x = Math.random();
        }
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(236,168,214,0.18)";
        ctx.fill();
      });

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };

    if (reduce) {
      draw();
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ display: "block" }}
    />
  );
}
