"use client";

// Home: hero con preview, pasos, galería de plantillas y una invitación de
// ejemplo completa al final. Con reveals de entrada (Motion); respeta
// prefers-reduced-motion vía MotionConfig.
import Link from "next/link";
import { motion, MotionConfig } from "motion/react";
import { MiniPreview } from "@/components/MiniPreview";
import { InvitationView } from "@/templates/InvitationView";
import { getTemplate, resolvePalette } from "@/templates/registry";
import { LAUNCH_OFFER, mxn, offerPriceCents } from "@/lib/pricing";

const steps = [
  { n: "1", t: "Elige plantilla", d: "Diseños animados listos, o empieza en blanco." },
  { n: "2", t: "Personaliza", d: "Colores, tipografía, animaciones y secciones a tu gusto." },
  { n: "3", t: "Comparte", d: "Publica y envía un enlace único a tus invitados." },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const FEATURED = "cita"; // plantilla que viaja detrás y se abre completa

export type TemplateCard = {
  key: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
};

export function Landing({ templates, hasUser }: { templates: TemplateCard[]; hasUser: boolean }) {
  return (
    <MotionConfig reducedMotion="user">
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
        <HeroText hasUser={hasUser} />
        <PreviewCard className="mx-auto w-full max-w-[300px]" />
      </section>
      <Steps />
      <Gallery templates={templates} />
      <CompleteInvitation />
    </MotionConfig>
  );
}

// Invitación completa real (misma plantilla destacada), full-bleed y scrolleable.
function CompleteInvitation() {
  const def = getTemplate(FEATURED);
  if (!def) return null;
  const content = def.schema.defaults;
  const palette = resolvePalette(def, content.paletteKey);
  return (
    <section aria-label="La invitación completa" className="relative z-10">
      <div className="mx-auto max-w-2xl px-5 pb-8 pt-14 text-center">
        <span className="inline-block rounded-full bg-lilac px-4 py-1 text-xs font-semibold uppercase tracking-widest text-coral-deep">
          Ejemplo
        </span>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Así se ve una invitación completa</h2>
        <p className="mt-2 text-ink/60">Un ejemplo real; recórrela para ver todas las secciones.</p>
      </div>
      <InvitationView content={content} palette={palette} style={def.style} />
    </section>
  );
}

function HeroText({ hasUser }: { hasUser: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="text-center lg:text-left"
    >
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
          href={hasUser ? "/create" : "/auth/login?screen_hint=signup"}
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
    </motion.div>
  );
}

function PreviewCard({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 0.15, ease: EASE }}
      className={className}
    >
      <div className="overflow-hidden rounded-[2.5rem] border-8 border-white bg-white shadow-2xl lg:rotate-2">
        <MiniPreview templateKey={FEATURED} scale={0.5} className="h-[520px]" />
      </div>
    </motion.div>
  );
}

function Steps() {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-5 py-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
            className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm"
          >
            <span className="dd-gradient grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white">
              {s.n}
            </span>
            <div>
              <h3 className="font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-ink/60">{s.d}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Gallery({ templates }: { templates: TemplateCard[] }) {
  return (
    <section id="plantillas" className="relative z-10 mx-auto max-w-5xl px-5 py-14">
      <h2 className="text-center text-3xl font-bold">Plantillas</h2>
      <p className="mt-2 text-center text-ink/60">Un pago único por invitación.</p>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t, i) => (
          <motion.div
            key={t.key}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
          >
            <Link
              href={`/create/${t.key}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative border-b border-line">
                {LAUNCH_OFFER && (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-coral px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                    Oferta de lanzamiento
                  </span>
                )}
                <MiniPreview templateKey={t.key} className="h-44" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs uppercase tracking-widest text-coral">{t.category}</p>
                <h3 className="mt-1 text-xl font-semibold">{t.name}</h3>
                <p className="mt-2 flex-1 text-sm text-ink/70">{t.description}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-coral-deep">
                      {mxn(offerPriceCents(t.base_price))}
                    </span>
                    {LAUNCH_OFFER && (
                      <span className="text-sm text-ink/40 line-through">{mxn(t.base_price)}</span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-coral-deep group-hover:underline">
                    Personalizar →
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
