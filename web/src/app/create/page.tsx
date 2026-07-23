import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_DRAFTS } from "@/lib/limits";
import { VERSION } from "@/lib/version";
import { allTemplates } from "@/templates/registry";
import { MiniPreview } from "@/components/MiniPreview";

// Selector de plantilla (incluye "En blanco"). Punto único de entrada al editor.
export default async function CreatePicker() {
  const uid = await requireUserId();

  // Cuenta borradores actuales para avisar al usuario ANTES de que elija
  // plantilla y descubra al guardar que ya no puede crear más.
  const admin = createAdminClient();
  const { count } = await admin
    .from("invitations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("status", "draft");
  const draftCount = count ?? 0;
  const atLimit = draftCount >= MAX_DRAFTS;

  return (
    <main className="flex-1">
      <header className="flex items-center justify-between border-b border-line bg-white px-5 py-4 sm:px-8">
        <Link href="/" className="dd-text-gradient text-xl font-extrabold">
          DD-Send
          <span className="ml-1.5 align-baseline text-[10px] font-medium text-ink/40">v{VERSION}</span>
        </Link>
        <Link href="/dashboard" className="text-sm font-semibold text-coral-deep">
          Mis invitaciones
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <h1 className="text-center text-3xl font-bold">Elige una plantilla</h1>
        <p className="mt-2 text-center text-ink/60">O empieza desde cero con una en blanco.</p>

        {atLimit && (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber/40 bg-amber/15 p-4 text-sm text-ink">
            <p className="font-semibold">Llegaste al máximo de {MAX_DRAFTS} borradores.</p>
            <p className="mt-1 text-ink/70">
              Puedes explorar las plantillas, pero <strong>Guardar borrador no funcionará</strong> hasta
              que elimines uno desde{" "}
              <Link href="/dashboard" className="font-semibold text-coral-deep underline">
                Mis invitaciones
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allTemplates.map((t) => (
            <Link
              key={t.key}
              href={`/create/${t.key}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="border-b border-line">
                <MiniPreview templateKey={t.key} />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-semibold">{t.name}</span>
                <span className="text-sm font-semibold text-coral-deep group-hover:underline">
                  Usar →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
