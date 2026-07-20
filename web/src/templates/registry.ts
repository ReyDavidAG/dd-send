import { InvitationView } from "./InvitationView";
import type { Field, InvitationContent, Palette, TemplateDef } from "./types";

// Campos editables comunes a las 3 plantillas del MVP.
const commonFields = (): Field[] => [
  { name: "paletteKey", label: "Paleta de colores", type: "palette" },
  { name: "title", label: "Título / lema", type: "text", required: true },
  { name: "toName", label: "Para (nombre)", type: "text", required: true },
  { name: "fromName", label: "De parte de", type: "text", required: true },
  { name: "message", label: "Mensaje", type: "textarea", required: true },
  { name: "signature", label: "Firma", type: "text" },
  { name: "eventName", label: "Nombre del evento", type: "text", required: true },
  { name: "eventDateLabel", label: "Fecha (texto visible)", type: "text", required: true },
  { name: "eventDate", label: "Fecha y hora exacta", type: "date", required: true, help: "Para la cuenta regresiva" },
  { name: "locationLabel", label: "Lugar / plataforma", type: "text" },
  { name: "locationLink", label: "Enlace (opcional)", type: "text", help: "Videollamada, mapa, etc." },
  { name: "photos", label: "Fotos", type: "photos" },
  { name: "rsvpWhatsapp", label: "WhatsApp para confirmar", type: "tel", help: "Con lada, solo dígitos" },
  { name: "rsvpMessage", label: "Mensaje de confirmación", type: "text" },
];

const pal = (
  key: string,
  name: string,
  [bg, surface, text, accent, accentDeep, band]: string[],
): Palette => ({ key, name, bg, surface, text, accent, accentDeep, band });

const sample = (over: Partial<InvitationContent>): InvitationContent => ({
  title: "Para ti",
  toName: "Denisse",
  fromName: "David",
  message: "Prepara las palomitas: tenemos una cita.",
  signature: "Con cariño",
  eventName: "Noche de película",
  eventDateLabel: "Hoy · 8:00 PM",
  eventDate: "2026-12-31T20:00:00-06:00",
  locationLabel: "Nos vemos en Discord 🎧",
  locationLink: "",
  photos: [
    "https://picsum.photos/seed/a/600/800",
    "https://picsum.photos/seed/b/600/800",
    "https://picsum.photos/seed/c/600/800",
  ],
  paletteKey: "rosa",
  rsvpWhatsapp: "",
  rsvpMessage: "¡Ahí estaré! 💕",
  ...over,
});

const templates: Record<string, TemplateDef> = {
  cita: {
    key: "cita",
    Component: InvitationView,
    schema: {
      fields: commonFields(),
      palettes: [
        pal("rosa", "Rosa cálido", ["#fdf6f0", "#ffffff", "#6e2b39", "#e0968f", "#c96f6a", "#f6d9d0"]),
        pal("vino", "Vino profundo", ["#2a1218", "#3a1a22", "#f6d9d0", "#e0968f", "#e0968f", "#3a1a22"]),
      ],
      defaults: sample({ paletteKey: "rosa" }),
    },
  },
  cumpleanos: {
    key: "cumpleanos",
    Component: InvitationView,
    schema: {
      fields: commonFields(),
      palettes: [
        pal("fiesta", "Fiesta", ["#fff7ed", "#ffffff", "#7c2d12", "#f59e0b", "#ea580c", "#fed7aa"]),
        pal("confeti", "Confeti", ["#faf5ff", "#ffffff", "#581c87", "#d946ef", "#a21caf", "#f5d0fe"]),
      ],
      defaults: sample({
        title: "¡Estás invitado!",
        eventName: "Mi cumpleaños",
        eventDateLabel: "Sábado 8:00 PM",
        locationLabel: "Salón Las Palmas",
        paletteKey: "fiesta",
      }),
    },
  },
  boda: {
    key: "boda",
    Component: InvitationView,
    schema: {
      fields: commonFields(),
      palettes: [
        pal("arena", "Arena", ["#faf7f2", "#ffffff", "#3f3a36", "#b08968", "#8a6d4f", "#eae3d9"]),
        pal("marfil", "Marfil", ["#fbfbf7", "#ffffff", "#44403c", "#a3a380", "#6b705c", "#e8e8dd"]),
      ],
      defaults: sample({
        title: "Nos casamos",
        eventName: "Nuestra boda",
        eventDateLabel: "12 de diciembre · 5:00 PM",
        locationLabel: "Jardín El Encanto",
        message: "Con la bendición de nuestras familias, queremos compartir contigo este día.",
        paletteKey: "arena",
      }),
    },
  },
};

export function getTemplate(key: string): TemplateDef | undefined {
  return templates[key];
}

export function resolvePalette(def: TemplateDef, paletteKey: string): Palette {
  return def.schema.palettes.find((p) => p.key === paletteKey) ?? def.schema.palettes[0];
}

export const templateKeys = Object.keys(templates);
