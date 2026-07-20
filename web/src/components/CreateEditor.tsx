"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { InvitationView } from "@/templates/InvitationView";
import { createClient } from "@/lib/supabase/client";
import { saveDraft } from "@/app/actions/invitations";
import type { Field, InvitationContent, Palette } from "@/templates/types";

type Props = {
  templateKey: string;
  fields: Field[];
  palettes: Palette[];
  initial: InvitationContent;
  userId: string;
};

export function CreateEditor({ templateKey, fields, palettes, initial, userId }: Props) {
  const [content, setContent] = useState<InvitationContent>(initial);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [slug, setSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    <div className="grid flex-1 gap-6 p-6 lg:grid-cols-2">
      {/* Formulario */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Personaliza tu invitación</h1>

        {fields.map((f) => (
          <label key={f.name} className="block space-y-1">
            <span className="text-sm font-medium">
              {f.label}
              {f.required && <span className="text-rose-deep"> *</span>}
            </span>

            {f.type === "textarea" ? (
              <textarea
                value={content[f.name] as string}
                onChange={(e) => set(f.name, e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-blush px-3 py-2 outline-none focus:border-rose"
              />
            ) : f.type === "palette" ? (
              <select
                value={content.paletteKey}
                onChange={(e) => set("paletteKey", e.target.value)}
                className="w-full rounded-lg border border-blush px-3 py-2"
              >
                {palettes.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>
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
                className="w-full rounded-lg border border-blush px-3 py-2 outline-none focus:border-rose"
              />
            )}
            {f.help && <span className="text-xs text-wine/60">{f.help}</span>}
          </label>
        ))}

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={onSave}
            disabled={pending}
            className="rounded-full bg-wine px-6 py-3 font-semibold text-cream transition hover:bg-rose-deep disabled:opacity-60"
          >
            {pending ? "Guardando…" : draftId ? "Guardar cambios" : "Guardar borrador"}
          </button>
          {slug && (
            <span className="text-sm">
              Borrador guardado ·{" "}
              <Link href="/dashboard" className="font-semibold text-rose-deep underline">
                ir al dashboard
              </Link>
            </span>
          )}
        </div>
        {error && <p className="text-sm text-rose-deep">{error}</p>}
        <p className="text-xs text-wine/50">
          El pago y la publicación vienen después (Fase 5). Por ahora se guarda como borrador.
        </p>
      </div>

      {/* Vista previa en vivo (sin animaciones GSAP para que no dependa del scroll) */}
      <div className="lg:sticky lg:top-6 lg:h-[85vh]">
        <div className="h-[60vh] overflow-y-auto rounded-2xl border border-blush shadow-inner lg:h-full">
          <InvitationView content={content} palette={palette} animate={false} />
        </div>
      </div>
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
            <img src={url} alt="" className="h-20 w-16 rounded object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-wine text-xs text-cream"
              aria-label="Quitar foto"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" multiple onChange={onFiles} disabled={uploading} />
      {uploading && <p className="text-xs text-wine/60">Subiendo…</p>}
      {err && <p className="text-xs text-rose-deep">{err}</p>}
    </div>
  );
}
