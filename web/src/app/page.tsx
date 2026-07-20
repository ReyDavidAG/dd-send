import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const mxn = (cents: number) =>
  (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default async function Home() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: templates },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("templates")
      .select("key,name,description,category,base_price")
      .eq("is_active", true)
      .order("base_price"),
  ]);

  return (
    <main className="flex-1">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <span className="text-xl font-semibold">Invita</span>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <Link href="/dashboard" className="font-semibold text-rose-deep">
              Mis invitaciones
            </Link>
          ) : (
            <>
              <Link href="/login">Iniciar sesión</Link>
              <Link
                href="/register"
                className="rounded-full bg-wine px-4 py-2 font-semibold text-cream"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold sm:text-6xl">
          Invitaciones que se sienten <span className="text-rose-deep">personales</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg">
          Elige una plantilla, personalízala con tus fotos y textos, y comparte una página
          única para tu evento. Sin diseñadores, sin complicaciones.
        </p>
        <Link
          href={user ? "/dashboard" : "/register"}
          className="mt-10 inline-block rounded-full bg-wine px-8 py-4 text-lg font-semibold text-cream transition hover:bg-rose-deep"
        >
          Crear mi invitación
        </Link>
      </section>

      {/* Catálogo */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-2xl font-semibold">Plantillas</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(templates ?? []).map((t) => (
            <article key={t.key} className="rounded-2xl bg-white p-6 shadow-md">
              <p className="text-xs uppercase tracking-widest text-rose">{t.category}</p>
              <h3 className="mt-2 text-xl font-semibold">{t.name}</h3>
              <p className="mt-2 text-sm text-wine/80">{t.description}</p>
              <p className="mt-4 font-semibold">{mxn(t.base_price)}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-wine/60">
        Hecho con 💕 · Invita
      </footer>
    </main>
  );
}
