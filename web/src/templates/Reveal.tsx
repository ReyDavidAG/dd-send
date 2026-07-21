"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { ANIMATIONS } from "./animations";
import type { AnimationKey } from "./types";

// Envoltorio de reveal al hacer scroll (Motion). whileInView usa
// IntersectionObserver, así que funciona igual en la página real (scroll de
// ventana) y dentro del contenedor scrolleable del preview del editor.
// anim="ninguna" o prefers-reduced-motion → render plano (sin animar).
export function Reveal({
  anim,
  className,
  children,
  delay = 0,
  amount = 0.25,
}: {
  anim: AnimationKey;
  className?: string;
  children: ReactNode;
  delay?: number;
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const def = ANIMATIONS[anim];
  if (reduce || anim === "ninguna" || !def) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={def.variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      transition={{ ...def.transition, delay }}
    >
      {children}
    </motion.div>
  );
}
