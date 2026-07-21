"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

// Confetti dibujado en <canvas> nativo (sin librerías): rectángulos de colores
// que caen con giro y vaivén, en bucle continuo. Se sobrepone al contenedor
// padre (que debe ser position:relative + overflow-hidden). pointer-events-none.
// ponytail: canvas 2D a mano; si algún día quieres ráfagas/físicas, canvas-confetti.
export function ConfettiOverlay({ colors, count = 90 }: { colors: string[]; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    type P = { x: number; y: number; w: number; h: number; color: string; rot: number; vr: number; vy: number; sway: number; vs: number };
    const spawn = (fromTop: boolean): P => ({
      x: rnd(0, w),
      y: fromTop ? rnd(-40, 0) : rnd(0, h),
      w: rnd(6, 11),
      h: rnd(9, 16),
      color: colors[Math.floor(rnd(0, colors.length))],
      rot: rnd(0, Math.PI * 2),
      vr: rnd(-0.12, 0.12),
      vy: rnd(0.6, 1.9),
      sway: rnd(0, Math.PI * 2),
      vs: rnd(0.01, 0.03),
    });
    const parts = Array.from({ length: count }, () => spawn(false));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y += p.vy;
        p.sway += p.vs;
        p.rot += p.vr;
        if (p.y - p.h > h) Object.assign(p, spawn(true));
        ctx.save();
        ctx.translate(p.x + Math.sin(p.sway) * 1.3, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduce, colors, count]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
