import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MiniPreview } from "@/components/MiniPreview";

const mxn = (cents: number) =>
  (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const steps = [
  { n: "1", t: "Elige plantilla", d: "Diseños animados listos, o empieza en blanco." },
  { n: "2", t: "Personaliza", d: "Colores, tipografía, animaciones y secciones a tu gusto." },
  { n: "3", t: "Comparte", d: "Publica y envía un enlace único a tus invitados." },
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
      {/* Header (claro) */}
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <span className="dd-text-gradient text-2xl font-extrabold">DD-Send</span>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <Link href="/dashboard" className="font-semibold text-coral-deep">
              Mis invitaciones
            </Link>
          ) : (
            <>
              <Link href="/login" className="font-semibold text-ink/70 hover:text-ink">
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-ink px-4 py-2 font-semibold text-sand transition hover:bg-ink/90"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero editorial con preview en vivo */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
        <div className="dd-fade-up text-center lg:text-left">
          <span className="inline-block rounded-full bg-lilac px-4 py-1 text-xs font-semibold uppercase tracking-widest text-coral-deep">
            Invitaciones digitales
          </span>
          <h1 className="mt-6 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Tu evento merece una <span className="dd-text-gradient">invitación única</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-pretty text-lg text-ink/70 lg:mx-0">
            Elige una plantilla animada, cámbiale colores, tipografía y animaciones, reordena las
            secciones y compártela con un enlace. Sin diseñadores.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href={user ? "/create" : "/register"}
              className="w-full rounded-full bg-coral px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-coral-deep sm:w-auto"
            >
              Crear mi invitación
            </Link>
            <a
              href="#plantillas"
              className="w-full rounded-full border border-line px-8 py-4 text-lg font-semibold transition hover:bg-white sm:w-auto"
            >
              Ver plantillas
            </a>
          </div>
        </div>

        {/* Preview destacado en un "marco" */}
        <div className="dd-fade-up mx-auto w-full max-w-[280px]">
          <div className="overflow-hidden rounded-[2.5rem] border-8 border-white bg-white shadow-2xl lg:rotate-2">
            <MiniPreview templateKey="cita" scale={0.5} className="h-[520px]" />
          </div>
        </div>
      </section>

      {/* Pasos */}
      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm">
              <span className="dd-gradient grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white">
                {s.n}
              </span>
              <div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-ink/60">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Galería de plantillas */}
      <section id="plantillas" className="mx-auto max-w-5xl px-5 py-14">
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
              <div className="border-b border-line">
                <MiniPreview templateKey={t.key} />
              </div>
              <div className="flex flex-1 flex-col p-5">
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
