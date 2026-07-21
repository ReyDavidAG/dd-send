import type { Palette } from "./types";

// Librería curada compartida por todas las plantillas.
// [bg, surface, text, accent, accentDeep, band]
const p = (key: string, name: string, c: string[]): Palette => ({
  key,
  name,
  bg: c[0],
  surface: c[1],
  text: c[2],
  accent: c[3],
  accentDeep: c[4],
  band: c[5],
});

export const PALETTES: Palette[] = [
  p("rosa", "Rosa cálido", ["#fdf6f0", "#ffffff", "#6e2b39", "#e0968f", "#c96f6a", "#f6d9d0"]),
  p("durazno", "Durazno", ["#fff7f0", "#ffffff", "#7c3a2e", "#f0a878", "#e07a4f", "#ffe3cf"]),
  p("coral", "Coral", ["#fff5f4", "#ffffff", "#7a2233", "#f07a72", "#d94f52", "#ffd9d5"]),
  p("lavanda", "Lavanda", ["#f8f5ff", "#ffffff", "#3d2c63", "#b199e0", "#7c5bbf", "#e9dffb"]),
  p("confeti", "Confeti", ["#faf5ff", "#ffffff", "#581c87", "#d946ef", "#a21caf", "#f5d0fe"]),
  p("oceano", "Océano", ["#f0f8fb", "#ffffff", "#123a4a", "#4fa3c7", "#1f7799", "#cdeaf3"]),
  p("menta", "Menta", ["#f1faf6", "#ffffff", "#14432f", "#5cc79b", "#2f9e73", "#cdeee0"]),
  p("bosque", "Bosque", ["#f3f7f1", "#ffffff", "#22331d", "#7fae5f", "#4f7d38", "#dcead2"]),
  p("fiesta", "Fiesta", ["#fff7ed", "#ffffff", "#7c2d12", "#f59e0b", "#ea580c", "#fed7aa"]),
  p("arena", "Arena", ["#faf7f2", "#ffffff", "#3f3a36", "#b08968", "#8a6d4f", "#eae3d9"]),
  p("marfil", "Marfil", ["#fbfbf7", "#ffffff", "#44403c", "#a3a380", "#6b705c", "#e8e8dd"]),
  p("noche", "Noche", ["#1c1424", "#2a1f33", "#f3e8ff", "#c084fc", "#e9d5ff", "#2a1f33"]),
  p("vino", "Vino profundo", ["#2a1218", "#3a1a22", "#f6d9d0", "#e0968f", "#f0b8ae", "#3a1a22"]),
  p("carbon", "Carbón", ["#18181b", "#27272a", "#fafafa", "#f4a259", "#f6b877", "#27272a"]),
];

export const paletteByKey = (key: string) =>
  PALETTES.find((x) => x.key === key) ?? PALETTES[0];
