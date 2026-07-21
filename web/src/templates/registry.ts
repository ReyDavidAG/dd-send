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
  { name: "fontKey", label: "Tipografía", type: "font" },
  {
    name: "headingWeight",
    label: "Grosor de títulos",
    type: "select",
    options: [
      { value: "400", label: "Normal" },
      { value: "600", label: "Seminegrita" },
      { value: "700", label: "Negrita" },
      { value: "800", label: "Extra negrita" },
    ],
    help: "Las fuentes manuscritas pueden ignorar el grosor.",
  },
  {
    name: "animationKey",
    label: "Animaciones",
    type: "animation",
    help: "Cómo aparecen las secciones al hacer scroll.",
  },
  {
    name: "headline",
    label: "Encabezado principal",
    type: "text",
    required: true,
    help: 'Texto grande del inicio. Ej. "David & Denisse" o "Cumpleaños de Andrés".',
  },
  { name: "title", label: "Título / lema", type: "text", required: true },
  { name: "toName", label: "Para (nombre)", type: "text", required: true },
  { name: "fromName", label: "De parte de", type: "text", required: true },
  { name: "message", label: "Mensaje", type: "textarea", required: true },
  { name: "signature", label: "Firma", type: "text" },
  { name: "eventName", label: "Nombre del evento", type: "text", required: true },
  { name: "eventDateLabel", label: "Fecha (texto visible)", type: "text", required: true },
  { name: "eventDate", label: "Fecha y hora exacta", type: "date", required: true, help: "Para la cuenta regresiva" },
  { name: "locationLabel", label: "Lugar / plataforma", type: "text" },
  {
    name: "locationLink",
    label: "Enlace (opcional)",
    type: "text",
    placeholder: "https://maps.google.com/?q=Salón+Las+Palmas",
    help: "Pega un enlace de Google Maps (se mostrará el mapa) o de videollamada (Meet, Zoom…).",
  },
  { name: "photos", label: "Fotos", type: "photos" },
  { name: "rsvpWhatsapp", label: "WhatsApp para confirmar", type: "phone", help: "Con lada; a este número llegan las confirmaciones." },
  { name: "rsvpMessage", label: "Mensaje de confirmación", type: "text" },
];

const STYLES: Record<string, TemplateStyle> = {
  cita: { hero: "photo" },
  cumpleanos: { hero: "festive" },
  boda: { hero: "split" },
  blank: { hero: "photo" },
};

const sample = (over: Partial<InvitationContent>): InvitationContent => ({
  sections: DEFAULT_SECTIONS.map((s) => ({ ...s })),
  fontKey: "romantica",
  headingWeight: "700",
  animationKey: "fade",
  headline: "David & Denisse",
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
    headline: "Ven a mi cumpleaños",
    title: "¡Estás invitado!",
    fontKey: "divertida",
    // Animación más enérgica por defecto: el look festivo se luce con "elevar".
    animationKey: "rise",
    eventName: "Mi cumpleaños",
    eventDateLabel: "Sábado · 8:00 PM",
    locationLabel: "Salón Las Palmas",
    signature: "¡Te esperamos! 🎉",
    rsvpMessage: "¡Ahí estaré! 🎂",
    paletteKey: "fiesta",
  }),
  boda: def("boda", "Boda", {
    headline: "Nos casamos",
    title: "Nuestra boda",
    fontKey: "elegante",
    eventName: "Nuestra boda",
    eventDateLabel: "12 de diciembre · 5:00 PM",
    locationLabel: "Jardín El Encanto",
    message: "Con la bendición de nuestras familias, queremos compartir contigo este día.",
    paletteKey: "arena",
  }),
  blank: def("blank", "En blanco", {
    headline: "Tu evento",
    title: "Invitación",
    fontKey: "moderna",
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
