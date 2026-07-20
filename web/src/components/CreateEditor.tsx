"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { InvitationView } from "@/templates/InvitationView";
import { createClient } from "@/lib/supabase/client";
import { saveDraft } from "@/app/actions/invitations";
import type { Field, InvitationContent, Palette } from "@/templates/types";

type Props = {
  templateKey: string;
  templateName: string;
  fields: Field[];
  palettes: Palette[];
  initial: InvitationContent;
  userId: string;
};

export function CreateEditor({
  templateKey,
  templateName,
  fields,
  palettes,
  initial,
  userId,
}: Props) {
  const [content, setContent] = useState<InvitationContent>(initial);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [slug, setSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [full, setFull] = useState(false);
  const [pending, startTransition] = useTransition();

  const palette = palettes.find((p) => p.key === content.paletteKey) ?? palettes[0];
  const set = (name: keyof InvitationContent, value: string | string[]) =>
    setContent((c) => ({ ...c, [name]: value }));

  const onSave = () =>
    startTransition(async () => {
      setError(null);
      try {
        const res = await saveDraft({ id: draftId, templateKey, content });
        setDraftId(res.id);
        setSlug(res.slug);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });

  return (
    <div className="flex flex-1 flex-col">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-3">
        <Link href="/dashboard" className="text-sm text-ink/60 hover:text-ink">
          ← Salir
        </Link>
        <span className="truncate text-sm font-semibold">{templateName}</span>
        <button
          onClick={onSave}
          disabled={pending}
          className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white transition hover:bg-coral-deep disabled:opacity-60"
        >
          {pending ? "Guardando…" : draftId ? "Guardar" : "Guardar borrador"}
        </button>
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
            <label key={f.name} className="block space-y-1">
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
                        content.paletteKey === p.key
                          ? "border-coral ring-2 ring-coral/30"
                          : "border-line"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ background: p.accentDeep }}
                      />
                      {p.name}
                    </button>
                  ))}
                </div>
              ) : f.type === "photos" ? (
                <PhotosField
                  value={content.photos}
                  userId={userId}
                  onChange={(urls) => set("photos", urls)}
                />
              ) : (
                <input
                  type={f.type === "date" ? "datetime-local" : f.type === "tel" ? "tel" : "text"}
                  value={
                    f.type === "date"
                      ? (content[f.name] as string).slice(0, 16)
                      : (content[f.name] as string)
                  }
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-coral"
                />
              )}
              {f.help && <span className="text-xs text-ink/50">{f.help}</span>}
            </label>
          ))}

          {slug && (
            <p className="rounded-xl bg-lilac px-4 py-3 text-sm">
              Borrador guardado ·{" "}
              <Link href="/dashboard" className="font-semibold text-coral-deep underline">
                ir al dashboard
              </Link>
            </p>
          )}
          {error && <p className="text-sm text-coral-deep">{error}</p>}
          <p className="text-xs text-ink/50">
            El pago y la publicación vienen después (Fase 5). Por ahora se guarda como borrador.
          </p>
        </div>

        {/* Vista previa */}
        <div
          className={`${tab === "preview" ? "block" : "hidden"} relative bg-lilac/40 lg:block lg:max-h-[calc(100vh-57px)]`}
        >
          <button
            onClick={() => setFull(true)}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold shadow ring-1 ring-line backdrop-blur"
          >
            ⛶ Pantalla completa
          </button>
          <div className="h-[70vh] overflow-y-auto lg:h-[calc(100vh-57px)]">
            <InvitationView content={content} palette={palette} animate={false} />
          </div>
        </div>
      </div>

      {/* Overlay pantalla completa */}
      {full && (
        <div className="dd-fade-in fixed inset-0 z-50 overflow-y-auto bg-black/20 backdrop-blur-sm">
          <button
            onClick={() => setFull(false)}
            className="fixed right-4 top-4 z-50 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg"
          >
            ✕ Cerrar
          </button>
          <InvitationView content={content} palette={palette} animate={false} />
        </div>
      )}
    </div>
  );
}

function PhotosField({
  value,
  onChange,
  userId,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  userId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const supabase = createClient();

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setErr(null);
    const urls: string[] = [];
    for (const f of files) {
      const safe = f.name.replace(/[^\w.-]/g, "_");
      const path = `${userId}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from("invitation-photos").upload(path, f);
      if (error) {
        setErr(error.message);
        continue;
      }
      urls.push(supabase.storage.from("invitation-photos").getPublicUrl(path).data.publicUrl);
    }
    onChange([...value, ...urls]);
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-20 w-16 rounded-lg object-cover ring-1 ring-line" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-coral text-xs text-white"
              aria-label="Quitar foto"
            >
              ×
            </button>
          </div>
        ))}
        <label className="grid h-20 w-16 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line text-2xl text-ink/40 hover:border-coral">
          +
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFiles}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
      {uploading && <p className="text-xs text-ink/60">Subiendo…</p>}
      {err && <p className="text-xs text-coral-deep">{err}</p>}
    </div>
  );
}
