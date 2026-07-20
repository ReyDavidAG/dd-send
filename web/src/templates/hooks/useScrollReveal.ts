"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Porta la lógica de GSAP ScrollTrigger de la referencia Astro a React.
// Devuelve un ref para el contenedor; cualquier elemento con [data-reveal]
// dentro de él se anima al entrar (fade + desplazamiento) y se REVIERTE al
// salir del viewport (toggleActions play/reverse en ambas direcciones).
// Personalizable por elemento con data-reveal-x / data-reveal-y (px).
export function useScrollReveal(enabled = true) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return; // vista previa del editor: sin animaciones
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          x: Number(el.dataset.revealX ?? 0),
          y: Number(el.dataset.revealY ?? 60),
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
    }, scope);

    return () => ctx.revert(); // limpia triggers y estilos al desmontar
  }, [enabled]);

  return scope;
}
