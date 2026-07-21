import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { allTemplates } from "@/templates/registry";
import { MiniPreview } from "@/components/MiniPreview";

// Selector de plantilla (incluye "En blanco"). Punto único de entrada al editor.
export default async function CreatePicker() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="flex-1">
      <header className="flex items-center justify-between border-b border-line bg-white px-5 py-4 sm:px-8">
        <Link href="/" className="dd-text-gradient text-xl font-extrabold">
          DD-Send
        </Link>
        <Link href="/dashboard" className="text-sm font-semibold text-coral-deep">
          Mis invitaciones
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <h1 className="text-center text-3xl font-bold">Elige una plantilla</h1>
        <p className="mt-2 text-center text-ink/60">O empieza desde cero con una en blanco.</p>

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
