"use client";

// Home: una card de preview VIAJA POR DETRÁS del contenido (fixed, z-0) durante
// el scroll. Al final del recorrido pasa al frente, se abre a pantalla completa
// y se FUNDE con la invitación COMPLETA (InvitationView real, todas las secciones
// con sus animaciones), que el usuario scrollea como si la estuviera viendo de
// verdad. En móvil (<lg) no hay card fija: la invitación completa se muestra a
// pantalla completa en flujo normal. Respeta prefers-reduced-motion.
import Link from "next/link";
import { useRef } from "react";
import { motion, MotionConfig, useReducedMotion, useScroll, useTransform } from "motion/react";
import { MiniPreview } from "@/components/MiniPreview";
import { InvitationView } from "@/templates/InvitationView";
import { getTemplate, resolvePalette } from "@/templates/registry";

const mxn = (cents: number) =>
  (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

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
  const reduce = useReducedMotion();
  const journeyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({
    target: journeyRef,
    offset: ["start start", "end end"],
  });

  // La card se mantiene tamaño tarjeta (detrás, a la derecha) hasta ~0.7; luego
  // se abre a pantalla completa y al final se desvanece para revelar la
  // invitación COMPLETA que queda debajo en flujo (fusión, no "fade a nada").
  const top = useTransform(p, [0, 0.7, 1], ["16vh", "9vh", "0vh"]);
  const right = useTransform(p, [0, 0.7, 1], ["4vw", "4vw", "0vw"]);
  const width = useTransform(p, [0, 0.7, 1], ["36vw", "36vw", "100vw"]);
  const height = useTransform(p, [0, 0.7, 1], ["66vh", "66vh", "100vh"]);
  const rotate = useTransform(p, [0, 0.7, 1], [2.5, 1.5, 0]);
  const borderRadius = useTransform(p, [0.7, 1], ["24px", "0px"]);
  const borderWidth = useTransform(p, [0.7, 1], [8, 0]);
  const boxShadow = useTransform(
    p,
    [0.7, 1],
    ["0 30px 60px -15px rgb(0 0 0 / 0.35)", "0 0 0 0 rgb(0 0 0 / 0)"],
  );
  const zIndex = useTransform(p, [0.68, 0.7], [0, 50]);
  const cardOpacity = useTransform(p, [0.9, 1], [1, 0]);
  const hintOpacity = useTransform(p, [0, 0.12], [1, 0]);

  // Versión estática (prefers-reduced-motion): sin card fija ni movimiento; la
  // invitación completa igual se muestra (sus reveals se autodesactivan).
  if (reduce) {
    return (
      <MotionConfig reducedMotion="user">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
          <HeroText hasUser={hasUser} />
          <PreviewCard className="mx-auto w-full max-w-[280px]" />
        </section>
        <Steps />
        <Gallery templates={templates} />
        <CompleteInvitation />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      {/* Card que viaja por detrás (desktop) y se abre a pantalla completa. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed box-border hidden overflow-hidden border-solid border-white bg-white lg:block"
        style={{
          top,
          right,
          width,
          height,
          rotate,
          borderRadius,
          borderWidth,
          boxShadow,
          zIndex,
          opacity: cardOpacity,
          transformOrigin: "top right",
        }}
      >
        <MiniPreview templateKey={FEATURED} scale={0.5} className="h-full w-full" />
      </motion.div>

      <motion.div
        style={{ opacity: hintOpacity }}
        className="pointer-events-none fixed inset-x-0 bottom-6 z-40 hidden text-center text-sm font-medium text-ink/50 lg:block"
      >
        Baja para ver la invitación completa ↓
      </motion.div>

      <div ref={journeyRef}>
        <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
          <HeroText hasUser={hasUser} />
          {/* Móvil: preview en flujo. Desktop: espacio reservado (la card fija va ahí). */}
          <PreviewCard className="mx-auto w-full max-w-[280px] lg:hidden" />
          <div aria-hidden className="hidden lg:block" style={{ height: "66vh" }} />
        </section>

        <Steps />
        <Gallery templates={templates} />

        {/* Desktop: espacio de scroll para que la card se abra antes de la invitación. */}
        <div aria-hidden className="hidden lg:block" style={{ height: "120vh" }} />
      </div>

      {/* Invitación COMPLETA (todas las secciones, animada, scrolleable). A
          pantalla completa en cualquier tamaño. La card fija se funde con esta. */}
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
          href={hasUser ? "/create" : "/register"}
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
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line transition hover:-translate-y-1 hover:shadow-lg"
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
          </motion.div>
        ))}
      </div>
    </section>
  );
}
