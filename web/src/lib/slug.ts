// Slug corto, no adivinable y sin caracteres ambiguos (0/O, 1/l/I).
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";

export function randomSlug(len = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
