import { InvitationView } from "./InvitationView";
import { PALETTES } from "./palettes";
import {
  DEFAULT_SECTIONS,
  type Field,
  type InvitationContent,
  type Palette,
  type TemplateDef,
  type TemplateStyle,
} from "./types";

// Campos editables comunes a las plantillas del MVP.
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

const SANS = "var(--font-geist-sans), system-ui, sans-serif";
const STYLES: Record<string, TemplateStyle> = {
  cita: { fontHead: "var(--font-script), cursive", fontBody: SANS, hero: "photo" },
  cumpleanos: { fontHead: "var(--font-fun), sans-serif", fontBody: SANS, hero: "festive" },
  boda: { fontHead: "var(--font-serif), serif", fontBody: "var(--font-serif), Georgia, serif", hero: "split" },
  blank: { fontHead: SANS, fontBody: SANS, hero: "photo" },
};

const sample = (over: Partial<InvitationContent>): InvitationContent => ({
  sections: DEFAULT_SECTIONS.map((s) => ({ ...s })),
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

const def = (key: string, name: string, over: Partial<InvitationContent>): TemplateDef => ({
  key,
  name,
  Component: InvitationView,
  style: STYLES[key],
  schema: { fields: commonFields(), palettes: PALETTES, defaults: sample(over) },
});

const templates: Record<string, TemplateDef> = {
  cita: def("cita", "Cita romántica", { paletteKey: "rosa" }),
  cumpleanos: def("cumpleanos", "Cumpleaños", {
    title: "¡Estás invitado!",
    eventName: "Mi cumpleaños",
    eventDateLabel: "Sábado 8:00 PM",
    locationLabel: "Salón Las Palmas",
    paletteKey: "fiesta",
  }),
  boda: def("boda", "Boda", {
    title: "Nos casamos",
    eventName: "Nuestra boda",
    eventDateLabel: "12 de diciembre · 5:00 PM",
    locationLabel: "Jardín El Encanto",
    message: "Con la bendición de nuestras familias, queremos compartir contigo este día.",
    paletteKey: "arena",
  }),
  blank: def("blank", "En blanco", {
    title: "Tu evento",
    toName: "Invitado",
    fromName: "Tú",
    message: "Escribe aquí tu mensaje.",
    signature: "",
    eventName: "Nombre del evento",
    eventDateLabel: "Fecha",
    eventDate: "",
    locationLabel: "",
    photos: [],
    paletteKey: "marfil",
    rsvpMessage: "¡Ahí estaré!",
  }),
};

export function getTemplate(key: string): TemplateDef | undefined {
  return templates[key];
}

export function resolvePalette(d: TemplateDef, paletteKey: string): Palette {
  return d.schema.palettes.find((p) => p.key === paletteKey) ?? d.schema.palettes[0];
}

export const allTemplates = Object.values(templates);
export const templateKeys = Object.keys(templates);
