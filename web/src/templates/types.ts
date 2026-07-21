import type { ComponentType } from "react";

// Secciones de la invitación que el usuario puede mostrar/ocultar y reordenar.
export type SectionId = "hero" | "message" | "photos" | "details" | "countdown" | "rsvp";
export type SectionConfig = { id: SectionId; visible: boolean };

export const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Portada",
  message: "Mensaje",
  photos: "Fotos",
  details: "Detalles",
  countdown: "Cuenta regresiva",
  rsvp: "Confirmación",
};

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: "hero", visible: true },
  { id: "message", visible: true },
  { id: "photos", visible: true },
  { id: "details", visible: true },
  { id: "countdown", visible: true },
  { id: "rsvp", visible: true },
];

// Contenido que el usuario llena y se guarda en invitations.content (jsonb).
// Es un superset que cubre las 3 plantillas del MVP.
export type InvitationContent = {
  sections: SectionConfig[];
  toName: string;
  fromName: string;
  title: string;
  message: string;
  signature: string;
  eventName: string;
  eventDateLabel: string;
  eventDate: string; // ISO con zona horaria (para el countdown)
  locationLabel: string;
  locationLink: string; // '' = solo texto
  photos: string[]; // URLs (Supabase Storage)
  paletteKey: string;
  rsvpWhatsapp: string; // dígitos con lada, '' = sin RSVP
  rsvpMessage: string;
};

// Paleta curada: se aplica como CSS vars en la raíz de la plantilla.
export type Palette = {
  key: string;
  name: string;
  bg: string;
  surface: string;
  text: string;
  accent: string;
  accentDeep: string;
  band: string;
};

// Definición de un campo editable (lo consume el formulario de la Fase 4).
export type Field = {
  name: keyof InvitationContent;
  label: string;
  type: "text" | "textarea" | "date" | "tel" | "photos" | "palette";
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type TemplateSchema = {
  fields: Field[];
  palettes: Palette[];
  defaults: InvitationContent;
};

// Estilo visual que distingue una plantilla de otra (tipografías + hero).
export type TemplateStyle = {
  fontHead: string; // CSS font-family (usa las vars cargadas en el layout)
  fontBody: string;
  hero: "photo" | "split" | "festive";
};

export type InvitationViewProps = {
  content: InvitationContent;
  palette: Palette;
  style: TemplateStyle;
  animate?: boolean;
};

export type TemplateDef = {
  key: string;
  name: string;
  Component: ComponentType<InvitationViewProps>;
  schema: TemplateSchema;
  style: TemplateStyle;
};
