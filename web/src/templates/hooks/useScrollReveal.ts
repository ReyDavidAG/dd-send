"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// GSAP ScrollTrigger portado a React (como la referencia Astro):
//  - [data-reveal]: fade + desplazamiento al entrar, se revierte al salir.
//  - [data-parallax]: parallax con scrub ligado al scroll.
// `intensity` escala el movimiento (suave < 1 < dinámica). enabled=false → nada.
export function useScrollReveal(enabled = true, intensity = 1) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          x: Number(el.dataset.revealX ?? 0) * intensity,
          y: Number(el.dataset.revealY ?? 60) * intensity,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play reverse play reverse",
          },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.to(el, {
          yPercent: 14 * intensity,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement ?? el,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    }, scope);

    return () => ctx.revert();
  }, [enabled, intensity]);

  return scope;
}
