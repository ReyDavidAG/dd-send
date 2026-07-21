import type { TargetAndTransition, Transition, Variants } from "motion/react";
import type { AnimationKey } from "./types";

// Catálogo de animaciones scroll-reveal (Motion) que el usuario elige por chip.
// Cada una define variants hidden→show; el reveal usa whileInView y el chip del
// editor genera un loop demo a partir de esas mismas variants (demoAnimate).
export type AnimDef = {
  key: Exclude<AnimationKey, "ninguna">;
  name: string;
  variants: Variants;
  transition: Transition;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export const ANIMATION_LIST: AnimDef[] = [
  {
    key: "fade",
    name: "Suave",
    variants: { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } },
    transition: { duration: 0.6, ease: EASE },
  },
  {
    key: "zoom",
    name: "Acercar",
    variants: { hidden: { opacity: 0, scale: 0.82 }, show: { opacity: 1, scale: 1 } },
    transition: { duration: 0.55, ease: EASE },
  },
  {
    key: "slide",
    name: "Deslizar",
    variants: { hidden: { opacity: 0, x: -60 }, show: { opacity: 1, x: 0 } },
    transition: { duration: 0.6, ease: EASE },
  },
  {
    key: "blur",
    name: "Enfoque",
    variants: { hidden: { opacity: 0, filter: "blur(12px)" }, show: { opacity: 1, filter: "blur(0px)" } },
    transition: { duration: 0.7, ease: "easeOut" },
  },
  {
    key: "flip",
    name: "Voltear",
    variants: {
      hidden: { opacity: 0, rotateX: -75, transformPerspective: 700 },
      show: { opacity: 1, rotateX: 0, transformPerspective: 700 },
    },
    transition: { duration: 0.7, ease: EASE },
  },
  {
    key: "rise",
    name: "Elevar",
    variants: { hidden: { opacity: 0, y: 80, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1 } },
    transition: { duration: 0.7, ease: EASE },
  },
];

export const ANIMATIONS: Record<string, AnimDef> = Object.fromEntries(
  ANIMATION_LIST.map((a) => [a.key, a]),
);

// Claves antiguas (antes eran intensidades) → animación equivalente.
const LEGACY: Record<string, AnimationKey> = { suave: "fade", dinamica: "zoom" };
export const normalizeAnim = (k: string | undefined): AnimationKey => {
  if (k === "ninguna") return "ninguna";
  if (k && ANIMATIONS[k]) return k as AnimationKey;
  return LEGACY[k ?? ""] ?? "fade";
};

// Keyframes [hidden, show] por propiedad para el loop demo del chip.
export function demoAnimate(def: AnimDef): TargetAndTransition {
  const hidden = def.variants.hidden as Record<string, unknown>;
  const show = def.variants.show as Record<string, unknown>;
  const out: Record<string, unknown[]> = {};
  for (const k of Object.keys(show)) out[k] = [hidden[k] ?? show[k], show[k]];
  return out as TargetAndTransition;
}
