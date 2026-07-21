// Tipografías seleccionables por el usuario (usan las vars cargadas en el layout).
export type FontOption = { key: string; name: string; head: string; body: string };

const SANS = "var(--font-geist-sans), system-ui, sans-serif";

export const FONTS: FontOption[] = [
  { key: "romantica", name: "Romántica", head: "var(--font-script), cursive", body: SANS },
  { key: "elegante", name: "Elegante", head: "var(--font-serif), serif", body: "var(--font-serif), Georgia, serif" },
  { key: "moderna", name: "Moderna", head: SANS, body: SANS },
  { key: "divertida", name: "Divertida", head: "var(--font-fun), sans-serif", body: SANS },
  { key: "clasica", name: "Clásica", head: "var(--font-serif), serif", body: SANS },
];

export const fontByKey = (key: string): FontOption =>
  FONTS.find((f) => f.key === key) ?? FONTS[0];
