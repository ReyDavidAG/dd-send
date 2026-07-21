// Ladas comunes (default México +52) y utilidades de teléfono compartidas.
export const COUNTRY_CODES = [
  { code: "52", label: "🇲🇽 +52" },
  { code: "1", label: "🇺🇸 +1" },
  { code: "34", label: "🇪🇸 +34" },
  { code: "57", label: "🇨🇴 +57" },
  { code: "54", label: "🇦🇷 +54" },
  { code: "51", label: "🇵🇪 +51" },
  { code: "56", label: "🇨🇱 +56" },
];

// Separa una cadena de dígitos "524741285394" en { cc, number(10) }.
export function splitPhone(full: string): { cc: string; number: string } {
  const digits = (full || "").replace(/\D/g, "");
  if (digits.length >= 10) return { cc: digits.slice(0, -10) || "52", number: digits.slice(-10) };
  return { cc: "52", number: "" };
}
