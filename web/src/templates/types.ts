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
export type AnimationKey = "ninguna" | "fade" | "zoom" | "slide" | "blur" | "flip" | "rise";

export type InvitationContent = {
  sections: SectionConfig[];
  fontKey: string; // clave de FONTS
  animationKey: AnimationKey;
  headline: string; // texto grande del hero (editable; reemplaza el "&" fijo)
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
  type: "text" | "textarea" | "date" | "tel" | "photos" | "palette" | "font" | "select" | "animation";
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[]; // para type 'select'
};

export type TemplateSchema = {
  fields: Field[];
  palettes: Palette[];
  defaults: InvitationContent;
};

// Estilo visual base de la plantilla (variante de hero). Las tipografías ahora
// las elige el usuario (content.fontKey).
export type TemplateStyle = {
  hero: "photo" | "split" | "festive";
};

// Controles de edición sobre el propio preview (reordenar / mostrar-ocultar
// secciones). Solo se pasan desde el editor; en la invitación publicada no.
export type EditControls = {
  onMove: (id: SectionId, dir: -1 | 1) => void;
  onToggle: (id: SectionId) => void;
};

export type InvitationViewProps = {
  content: InvitationContent;
  palette: Palette;
  style: TemplateStyle;
  animate?: boolean;
  edit?: EditControls;
};

export type TemplateDef = {
  key: string;
  name: string;
  Component: ComponentType<InvitationViewProps>;
  schema: TemplateSchema;
  style: TemplateStyle;
};
