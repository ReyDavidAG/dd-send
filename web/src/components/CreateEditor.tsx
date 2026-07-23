"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { motion } from "motion/react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { InvitationView } from "@/templates/InvitationView";
import { saveDraft } from "@/app/actions/invitations";
import { uploadPhoto, deletePhoto, listPhotos } from "@/app/actions/photos";
import { MAX_LIBRARY, MAX_SELECTED } from "@/lib/limits";
import { PhoneInput } from "@/components/PhoneInput";
import { DateTimeField } from "@/components/DateTimeField";
import { IconArrowLeft, IconLayout, IconTrash } from "@/components/icons";
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

// Tope de tamaño por foto. Debe coincidir con `experimental.serverActions.bodySizeLimit`
// en next.config.ts (10 MB). Sirve para avisar al usuario antes de mandar un request
// que sabemos que va a fallar con 413.
const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

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
  // Si el usuario está creando un NUEVO borrador y ya tiene el máximo,
  // mostramos un banner persistente arriba del formulario.
  draftLimitWarning?: { count: number; max: number } | null;
};

export function CreateEditor({
  templateKey,
  templateName,
  fields,
  palettes,
  style,
  initial,
  initialId,
  draftLimitWarning,
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
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* Barra superior */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-5 py-3">
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
      <div className="flex shrink-0 border-b border-line lg:hidden">
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

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Formulario */}
        <div
          className={`${tab === "edit" ? "flex" : "hidden"} min-h-0 flex-1 flex-col space-y-4 overflow-y-auto p-5 lg:flex lg:w-1/2`}
        >
          {draftLimitWarning && (
            <div className="rounded-xl border border-amber/40 bg-amber/15 p-3 text-sm text-ink">
              <p className="font-semibold">
                Ya tienes {draftLimitWarning.count} borradores (máximo {draftLimitWarning.max}).
              </p>
              <p className="mt-1 text-ink/70">
                Puedes llenar el formulario, pero <strong>Guardar no funcionará</strong> hasta que
                elimines uno en{" "}
                <Link href="/dashboard" className="font-semibold text-coral-deep underline">
                  Mis invitaciones
                </Link>
                .
              </p>
            </div>
          )}
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
          className={`${tab === "preview" ? "flex" : "hidden"} relative min-h-0 flex-1 bg-lilac/40 lg:flex lg:w-1/2`}
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
          <div ref={previewRef} className="min-h-0 w-full flex-1 overflow-y-auto">
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

const dedupe = (arr: string[]) => Array.from(new Set(arr));
// Foto propia = archivo en nuestro bucket de Storage. Las default de la
// plantilla (picsum, etc.) no lo son: se pueden quitar del ejemplo, pero no
// "eliminar" (no hay registro que borrar) ni cuentan para el tope de galería.
const isOwned = (url: string) => url.includes("/invitation-photos/");

// Galería del usuario (hasta MAX_LIBRARY registros) + selección de esta
// invitación (hasta MAX_SELECTED). `value` = content.photos = las seleccionadas
// en orden; value[0] es la portada. La galería vive en Storage (listPhotos).
function PhotosField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [library, setLibrary] = useState<string[]>(value);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Carga inicial: los registros de Storage + las ya seleccionadas (por si el
  // list fallara, las seleccionadas siempre deben verse).
  useEffect(() => {
    let alive = true;
    listPhotos()
      .then((urls) => alive && setLibrary((prev) => dedupe([...urls, ...prev])))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const ownedCount = library.filter(isOwned).length; // solo las subidas cuentan
  const libFull = ownedCount >= MAX_LIBRARY;
  const selectFull = value.length >= MAX_SELECTED;

  // Selecciona/deselecciona una foto para esta invitación (máx MAX_SELECTED).
  const toggle = (url: string) => {
    if (value.includes(url)) onChange(value.filter((u) => u !== url));
    else if (!selectFull) onChange([...value, url]);
  };

  // La primera seleccionada es la portada; la mueve al inicio.
  const makeCover = (url: string) => {
    if (value[0] === url) return;
    onChange([url, ...value.filter((u) => u !== url)]);
  };

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const room = MAX_LIBRARY - ownedCount;
    const files = Array.from(e.target.files ?? []).slice(0, room);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setErr(null);
    const added: string[] = [];
    for (const f of files) {
      // Filtra fotos que reventarían el límite de Server Actions (ver
      // next.config.ts → experimental.serverActions.bodySizeLimit).
      // Sin este guard, el server devuelve 413 y el cliente muestra el
      // error genérico "Server Components render".
      if (f.size > MAX_UPLOAD_BYTES) {
        setErr(`"${f.name}" pesa ${(f.size / 1024 / 1024).toFixed(1)} MB; el máximo por foto es ${MAX_UPLOAD_MB} MB.`);
        continue;
      }
      try {
        const fd = new FormData();
        fd.append("file", f);
        const { url } = await uploadPhoto(fd); // Server Action (service-role + sesión Auth0)
        added.push(url);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "No se pudo subir la foto.");
      }
    }
    if (added.length) {
      setLibrary((prev) => dedupe([...added, ...prev]));
      // auto-selecciona las nuevas hasta llenar el máximo
      const room = MAX_SELECTED - value.length;
      if (room > 0) onChange([...value, ...added.slice(0, room)]);
    }
    setUploading(false);
  }

  // Elimina el registro propio: borra archivo + quita la URL de todas las
  // invitaciones (deletePhoto en el server) y de la selección/galería local.
  const removeFromLibrary = (url: string) => {
    setLibrary((prev) => prev.filter((u) => u !== url));
    onChange(value.filter((u) => u !== url));
    void deletePhoto(url).catch(() => {});
  };

  // Quita una foto de ejemplo (default de la plantilla): solo local, sin server.
  const removeExample = (url: string) => {
    setLibrary((prev) => prev.filter((u) => u !== url));
    onChange(value.filter((u) => u !== url));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {library.map((url) => {
          const pos = value.indexOf(url); // -1 = no seleccionada
          const selected = pos >= 0;
          const isCover = pos === 0;
          const owned = isOwned(url);
          return (
            <div key={url} className="relative">
              <button
                type="button"
                onClick={() => toggle(url)}
                disabled={!selected && selectFull}
                aria-pressed={selected}
                className={`block w-full overflow-hidden rounded-lg ring-1 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected ? "ring-2 ring-coral" : "ring-line hover:ring-coral/50"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="aspect-[3/4] w-full object-cover" />
                {/* Indicador de selección / orden */}
                <span
                  className={`absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                    selected ? "bg-coral text-white" : "bg-white/85 text-ink/40 ring-1 ring-line"
                  }`}
                >
                  {selected ? pos + 1 : ""}
                </span>
                {!owned && !selected && (
                  <span className="absolute bottom-1 left-1 rounded bg-ink/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                    Ejemplo
                  </span>
                )}
              </button>

              {owned ? (
                <PhotoDeleteButton onConfirm={() => removeFromLibrary(url)} />
              ) : (
                <button
                  type="button"
                  onClick={() => removeExample(url)}
                  className="absolute -right-1.5 -top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-ink/60 text-sm text-white shadow ring-2 ring-white transition hover:bg-ink"
                  aria-label="Quitar foto de ejemplo"
                  title="Quitar foto de ejemplo"
                >
                  ×
                </button>
              )}

              {isCover ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-lg bg-coral/90 py-0.5 text-center text-[10px] font-semibold text-white">
                  Portada
                </span>
              ) : selected ? (
                <button
                  type="button"
                  onClick={() => makeCover(url)}
                  className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/55 py-0.5 text-center text-[10px] font-medium text-white transition hover:bg-black/75"
                >
                  Hacer portada
                </button>
              ) : null}
            </div>
          );
        })}

        {!libFull && (
          <label className="grid aspect-[3/4] cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line text-2xl text-ink/40 hover:border-coral">
            +
            <input type="file" accept="image/*" multiple onChange={onFiles} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>
      <p className="text-xs text-ink/50">
        Toca para elegir hasta {MAX_SELECTED} ({value.length}/{MAX_SELECTED}); la #1 es la portada.
        Tu galería guarda hasta {MAX_LIBRARY} fotos ({ownedCount}/{MAX_LIBRARY}). Las de «ejemplo»
        puedes quitarlas y no ocupan lugar.
      </p>
      {uploading && <p className="text-xs text-ink/60">Subiendo…</p>}
      {err && <p className="text-xs text-coral-deep">{err}</p>}
    </div>
  );
}

// Botón de basura sobre cada foto con confirmación (Radix AlertDialog).
function PhotoDeleteButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger
        className="absolute -right-1.5 -top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-coral text-white shadow ring-2 ring-white transition hover:bg-coral-deep"
        aria-label="Eliminar foto"
      >
        <IconTrash className="h-3.5 w-3.5" />
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dd-overlay fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <AlertDialog.Content className="dd-content fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lilac text-coral-deep">
              <IconTrash className="h-5 w-5" />
            </span>
            <div>
              <AlertDialog.Title className="text-lg font-bold">¿Eliminar foto?</AlertDialog.Title>
              <AlertDialog.Description className="mt-1 text-sm text-ink/60">
                Se borra de tu galería y de cualquier invitación donde la uses. No se puede deshacer.
              </AlertDialog.Description>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-sand">
              Cancelar
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-full bg-coral-deep px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink"
            >
              <IconTrash className="h-4 w-4" /> Sí, eliminar
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
