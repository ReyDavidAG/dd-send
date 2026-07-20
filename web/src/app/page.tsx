import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const mxn = (cents: number) =>
  (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const steps = [
  { n: "1", t: "Elige una plantilla", d: "Cita, cumpleaños o boda — diseños listos y animados." },
  { n: "2", t: "Personalízala", d: "Tus fotos, textos, fecha y colores, con vista previa en vivo." },
  { n: "3", t: "Compártela", d: "Publica y envía un enlace único a tus invitados." },
];

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
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8">
        <span className="text-xl font-bold tracking-tight text-white">DD-Send</span>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-white/15 px-4 py-2 font-semibold text-white backdrop-blur transition hover:bg-white/25"
            >
              Mis invitaciones
            </Link>
          ) : (
            <>
              <Link href="/login" className="font-semibold text-white/90 hover:text-white">
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-white px-4 py-2 font-semibold text-coral-deep transition hover:bg-white/90"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="dd-gradient-animated relative overflow-hidden px-5 pb-28 pt-32 text-center sm:pt-40">
        <div className="dd-fade-up mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-white/15 px-4 py-1 text-xs font-medium uppercase tracking-widest text-white backdrop-blur">
            Invitaciones digitales
          </span>
          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Invitaciones que se sienten hechas a mano
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-white/90">
            Elige una plantilla animada, personalízala con tus fotos y textos, y comparte una
            página única para tu evento. Sin diseñadores, sin complicaciones.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={user ? "/dashboard" : "/register"}
              className="w-full rounded-full bg-white px-8 py-4 text-lg font-semibold text-coral-deep shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto"
            >
              Crear mi invitación
            </Link>
            <a
              href="#plantillas"
              className="w-full rounded-full border border-white/40 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              Ver plantillas
            </a>
          </div>
        </div>
        {/* curva inferior */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-t-[50%] bg-sand" />
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="dd-fade-up rounded-2xl bg-white p-6 shadow-sm"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="dd-gradient grid h-10 w-10 place-items-center rounded-full font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-ink/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Catálogo */}
      <section id="plantillas" className="mx-auto max-w-5xl px-5 pb-24">
        <h2 className="text-center text-3xl font-bold">Plantillas</h2>
        <p className="mt-2 text-center text-ink/60">Un pago único por invitación.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(templates ?? []).map((t, i) => (
            <Link
              key={t.key}
              href={`/create/${t.key}`}
              style={{ animationDelay: `${i * 0.08}s` }}
              className="dd-fade-up group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="dd-gradient flex h-32 items-center justify-center text-4xl">
                {t.category === "boda" ? "💍" : t.category === "cumpleanos" ? "🎉" : "💕"}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs uppercase tracking-widest text-coral">{t.category}</p>
                <h3 className="mt-1 text-xl font-semibold">{t.name}</h3>
                <p className="mt-2 flex-1 text-sm text-ink/70">{t.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold">{mxn(t.base_price)}</span>
                  <span className="text-sm font-semibold text-coral-deep group-hover:underline">
                    Personalizar →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-line px-5 py-10 text-center text-sm text-ink/50">
        DD-Send · Hecho con 💕
      </footer>
    </main>
  );
}
