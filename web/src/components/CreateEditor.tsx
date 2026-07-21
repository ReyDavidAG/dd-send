"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { motion } from "motion/react";
import { InvitationView } from "@/templates/InvitationView";
import { saveDraft } from "@/app/actions/invitations";
import { uploadPhoto, deletePhoto } from "@/app/actions/photos";
import { PhoneInput } from "@/components/PhoneInput";
import { DateTimeField } from "@/components/DateTimeField";
import { IconArrowLeft, IconLayout } from "@/components/icons";
import { PayButton } from "@/components/PayButton";
import { FONTS } from "@/templates/fonts";
import { ANIMATION_LIST, demoAnimate, normalizeAnim } from "@/templates/animations";
import {
  type Field,
  type InvitationContent,
  type Palette,
  type SectionId,
  type TemplateStyle,
} from "@/templates/types";

// A qué sección lleva el scroll del preview al enfocar cada campo.
const FIELD_SECTION: Partial<Record<keyof InvitationContent, SectionId>> = {
  title: "message",
  toName: "hero",
  fromName: "hero",
  message: "message",
  signature: "message",
  eventName: "details",
  eventDateLabel: "details",
  eventDate: "countdown",
  locationLabel: "details",
  locationLink: "details",
  photos: "photos",
  rsvpWhatsapp: "rsvp",
  rsvpMessage: "rsvp",
};

type Props = {
  templateKey: string;
  templateName: string;
  fields: Field[];
  palettes: Palette[];
  style: TemplateStyle;
  initial: InvitationContent;
  initialId?: string;
};

export function CreateEditor({
  templateKey,
  templateName,
  fields,
  palettes,
  style,
  initial,
  initialId,
}: Props) {
  const previewRef = useRef<HTMLDivElement>(null);

  // Desktop: al enfocar un campo, desliza el preview hasta su sección.
  const scrollToSection = (section?: SectionId) => {
    if (!section || !window.matchMedia("(min-width:1024px)").matches) return;
    const c = previewRef.current;
    const el = c?.querySelector(`#sec-${section}`) as HTMLElement | null;
    if (!c || !el) return;
    c.scrollTo({ top: c.scrollTop + (el.getBoundingClientRect().top - c.getBoundingClientRect().top), behavior: "smooth" });
  };
  const [content, setContent] = useState<InvitationContent>(initial);
  const [draftId, setDraftId] = useState<string | undefined>(initialId);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [full, setFull] = useState(false);
  const [pending, startTransition] = useTransition();

  const palette = palettes.find((p) => p.key === content.paletteKey) ?? palettes[0];
  const set = (name: keyof InvitationContent, value: unknown) =>
    setContent((c) => ({ ...c, [name]: value }) as InvitationContent);

  // Controles de secciones directamente sobre el preview.
  const moveSection = (id: SectionId, dir: -1 | 1) =>
    setContent((c) => {
      const i = c.sections.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= c.sections.length) return c;
      const arr = [...c.sections];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...c, sections: arr };
    });
  const toggleSection = (id: SectionId) =>
    setContent((c) => ({
      ...c,
      sections: c.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
    }));
  const editControls = { onMove: moveSection, onToggle: toggleSection };

  const onSave = () =>
    startTransition(async () => {
      setError(null);
      setSaved(false);
      try {
        const res = await saveDraft({ id: draftId, templateKey, content });
        setDraftId(res.id);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });

  return (
    <div className="flex flex-1 flex-col">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-5 py-3">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:bg-sand"
          >
            <IconArrowLeft className="h-4 w-4" /> Salir
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:bg-sand"
          >
            <IconLayout className="h-4 w-4" /> Cambiar plantilla
          </Link>
        </div>
        <span className="order-last w-full truncate text-center text-sm font-semibold sm:order-none sm:w-auto">
          {templateName}
        </span>
        <div className="flex items-center gap-2">
          {saved && !pending && <span className="text-sm text-green-600">✓ Guardado</span>}
          <button
            onClick={onSave}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white transition hover:bg-coral-deep disabled:opacity-60"
          >
            {pending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {pending ? "Guardando…" : draftId ? "Guardar" : "Guardar borrador"}
          </button>
          {draftId && (
            <PayButton
              invitationId={draftId}
              className="rounded-full border border-coral px-5 py-2 text-sm font-semibold text-coral-deep transition hover:bg-lilac disabled:opacity-60"
            >
              Pagar y publicar
            </PayButton>
          )}
        </div>
      </div>

      {/* Tabs (solo móvil) */}
      <div className="flex border-b border-line lg:hidden">
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              tab === t ? "border-b-2 border-coral text-coral-deep" : "text-ink/50"
            }`}
          >
            {t === "edit" ? "Editar" : "Vista previa"}
          </button>
        ))}
      </div>

      <div className="grid flex-1 lg:grid-cols-2">
        {/* Formulario */}
        <div
          className={`${tab === "edit" ? "block" : "hidden"} space-y-4 overflow-y-auto p-5 lg:block lg:max-h-[calc(100vh-57px)]`}
        >
          {fields.map((f) => (
            <label
              key={f.name}
              className="block space-y-1"
              onFocus={() => scrollToSection(FIELD_SECTION[f.name])}
            >
              <span className="text-sm font-medium">
                {f.label}
                {f.required && <span className="text-coral"> *</span>}
              </span>

              {f.type === "textarea" ? (
                <textarea
                  value={content[f.name] as string}
                  onChange={(e) => set(f.name, e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-coral"
                />
              ) : f.type === "palette" ? (
                <div className="flex flex-wrap gap-2">
                  {palettes.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => set("paletteKey", p.key)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        content.paletteKey === p.key ? "border-coral ring-2 ring-coral/30" : "border-line"
                      }`}
                    >
                      <span className="h-4 w-4 rounded-full" style={{ background: p.accentDeep }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              ) : f.type === "font" ? (
                <div className="flex flex-wrap gap-2">
                  {FONTS.map((ft) => (
                    <button
                      key={ft.key}
                      type="button"
                      onClick={() => set("fontKey", ft.key)}
                      style={{ fontFamily: ft.head }}
                      className={`rounded-full border px-3 py-1.5 text-base transition ${
                        content.fontKey === ft.key ? "border-coral ring-2 ring-coral/30" : "border-line"
                      }`}
                    >
                      {ft.name}
                    </button>
                  ))}
                </div>
              ) : f.type === "animation" ? (
                <AnimationField
                  value={normalizeAnim(content.animationKey)}
                  onChange={(k) => set("animationKey", k)}
                />
              ) : f.type === "select" ? (
                <select
                  value={content[f.name] as string}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-coral"
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "phone" ? (
                <PhoneInput value={content[f.name] as string} onChange={(v) => set(f.name, v)} />
              ) : f.type === "date" ? (
                <DateTimeField value={content[f.name] as string} onChange={(v) => set(f.name, v)} />
              ) : f.type === "photos" ? (
                <PhotosField value={content.photos} onChange={(urls) => set("photos", urls)} />
              ) : (
                <input
                  type={f.type === "tel" ? "tel" : "text"}
                  value={content[f.name] as string}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-coral"
                />
              )}
              {f.help && <span className="text-xs text-ink/50">{f.help}</span>}
            </label>
          ))}

          {error && <p className="text-sm text-coral-deep">{error}</p>}
          <p className="text-xs text-ink/50">
            Guarda el borrador y luego «Pagar y publicar» para activar la invitación.
          </p>
        </div>

        {/* Vista previa */}
        <div
          className={`${tab === "preview" ? "block" : "hidden"} relative bg-lilac/40 lg:block lg:max-h-[calc(100vh-57px)]`}
        >
          <button
            onClick={() => setFull(true)}
            className="absolute left-3 top-3 z-40 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold shadow ring-1 ring-line backdrop-blur"
          >
            ⛶ Pantalla completa
          </button>
          <p className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs text-ink/60 shadow ring-1 ring-line backdrop-blur">
            Usa ↑↓ y 👁 sobre cada sección. «Pantalla completa» muestra las animaciones.
          </p>
          <div ref={previewRef} className="h-[70vh] overflow-y-auto lg:h-[calc(100vh-57px)]">
            <InvitationView content={content} palette={palette} style={style} animate={false} edit={editControls} />
          </div>
        </div>
      </div>

      {full && (
        <div className="dd-fade-in fixed inset-0 z-50 overflow-y-auto bg-black/20 backdrop-blur-sm">
          <button
            onClick={() => setFull(false)}
            className="fixed right-4 top-4 z-50 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg"
          >
            ✕ Cerrar
          </button>
          <InvitationView content={content} palette={palette} style={style} />
        </div>
      )}
    </div>
  );
}

// Selector de animación por chips: cada chip muestra una figura repitiendo la
// animación en loop (demoAnimate deriva los keyframes de las variants).
function AnimationField({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  const chip = (key: string, name: string, node: React.ReactNode) => {
    const active = value === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
          active ? "border-coral ring-2 ring-coral/30" : "border-line hover:border-coral/50"
        }`}
      >
        <span className="grid h-10 w-full place-items-center overflow-hidden rounded-lg bg-lilac/40">
          {node}
        </span>
        {name}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {ANIMATION_LIST.map((a) =>
        chip(
          a.key,
          a.name,
          <motion.span
            className="h-5 w-5 rounded bg-coral/80"
            animate={demoAnimate(a)}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", repeatDelay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />,
        ),
      )}
      {chip("ninguna", "Sin animación", <span className="h-5 w-5 rounded bg-coral/50" />)}
    </div>
  );
}

const MAX_PHOTOS = 6;

function PhotosField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const full = value.length >= MAX_PHOTOS;

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const room = MAX_PHOTOS - value.length;
    const files = Array.from(e.target.files ?? []).slice(0, room); // respeta el límite
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setErr(null);
    const urls: string[] = [];
    for (const f of files) {
      try {
        const fd = new FormData();
        fd.append("file", f);
        const { url } = await uploadPhoto(fd); // Server Action (service-role + sesión Auth0)
        urls.push(url);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "No se pudo subir la foto.");
      }
    }
    onChange([...value, ...urls]);
    setUploading(false);
  }

  // Quita la foto de la lista Y borra el archivo real de Storage.
  const remove = (i: number) => {
    const url = value[i];
    onChange(value.filter((_, j) => j !== i));
    void deletePhoto(url).catch(() => {});
  };

  // La primera foto es la portada/banner (hero). "Hacer portada" la mueve al inicio.
  const makeCover = (i: number) => {
    if (i === 0) return;
    const arr = [...value];
    const [it] = arr.splice(i, 1);
    arr.unshift(it);
    onChange(arr);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className={`h-20 w-16 rounded-lg object-cover ring-1 ring-line ${i === 0 ? "ring-2 ring-coral" : ""}`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-coral text-xs text-white"
              aria-label="Quitar foto"
            >
              ×
            </button>
            {i === 0 ? (
              <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-coral/90 py-0.5 text-center text-[10px] font-semibold text-white">
                Portada
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(i)}
                className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/55 py-0.5 text-center text-[10px] font-medium text-white transition hover:bg-black/75"
              >
                Hacer portada
              </button>
            )}
          </div>
        ))}
        {!full && (
          <label className="grid h-20 w-16 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line text-2xl text-ink/40 hover:border-coral">
            +
            <input type="file" accept="image/*" multiple onChange={onFiles} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>
      <p className="text-xs text-ink/50">
        {value.length}/{MAX_PHOTOS} fotos. La del borde coral es la portada; «Hacer portada» cambia cuál va de banner.
      </p>
      {uploading && <p className="text-xs text-ink/60">Subiendo…</p>}
      {err && <p className="text-xs text-coral-deep">{err}</p>}
    </div>
  );
}
