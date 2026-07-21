"use client";

// Landing del home con animaciones scroll-driven vía Motion (useScroll + useTransform).
// Diseño intacto: solo se sustituyen las animaciones. Scroll orquestra:
//  - Hero (parallax out al hacer scroll hacia abajo)
//  - Pasos y tarjetas de plantillas (stagger al entrar en viewport)
//  - Debajo de las plantillas: preview "arrastrado desde detrás" (sección sticky
//    cuyo scale/opacity/y depende de scrollYProgress)
// Se respeta prefers-reduced-motion vía <MotionConfig reducedMotion="user">.
import Link from "next/link";
import { useRef } from "react";
import { motion, MotionConfig, useScroll, useTransform } from "motion/react";
import { MiniPreview } from "@/components/MiniPreview";

const mxn = (cents: number) =>
  (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const steps = [
  { n: "1", t: "Elige plantilla", d: "Diseños animados listos, o empieza en blanco." },
  { n: "2", t: "Personaliza", d: "Colores, tipografía, animaciones y secciones a tu gusto." },
  { n: "3", t: "Comparte", d: "Publica y envía un enlace único a tus invitados." },
];

// Curva de easing común (suave, lenta al final) — evita que las animaciones se
// sientan lineales o reboten al final.
const EASE = [0.22, 1, 0.36, 1] as const;

export type TemplateCard = {
  key: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
};

export function Landing({
  templates,
  hasUser,
}: {
  templates: TemplateCard[];
  hasUser: boolean;
}) {
  // Hero: parallax out a medida que el hero sale del viewport.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroTextY = useTransform(heroProgress, [0, 1], [0, -120]);
  const heroTextOpacity = useTransform(heroProgress, [0, 0.7, 1], [1, 0.6, 0]);
  const heroPreviewScale = useTransform(heroProgress, [0, 1], [1, 0.82]);
  const heroPreviewOpacity = useTransform(heroProgress, [0, 1], [1, 0.25]);

  // Preview debajode las plantillas: sección alta (220vh) con un sticky hijo que
  // se queda "pinneado". Mientras el usuario scrolla, scrollYProgress va de 0 a 1
  // y el preview crece / se mueve / aparece, simulando que "sale desde detrás".
  const revealRef = useRef<HTMLElement>(null);
  const { scrollYProgress: revealProgress } = useScroll({
    target: revealRef,
    offset: ["start end", "end start"],
  });
  const previewScale = useTransform(revealProgress, [0, 0.55, 1], [0.55, 1.1, 1]);
  const previewOpacity = useTransform(revealProgress, [0, 0.18, 0.85, 1], [0, 1, 1, 0]);
  const previewY = useTransform(revealProgress, [0, 1], [80, -60]);

  return (
    <MotionConfig reducedMotion="user">
      {/* Hero editorial — fade-up al montar + parallax out por scroll. */}
      <section
        ref={heroRef}
        className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ y: heroTextY, opacity: heroTextOpacity }}
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

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.15, ease: EASE }}
          style={{ scale: heroPreviewScale, opacity: heroPreviewOpacity }}
          className="mx-auto w-full max-w-[280px]"
        >
          <div className="overflow-hidden rounded-[2.5rem] border-8 border-white bg-white shadow-2xl lg:rotate-2">
            <MiniPreview templateKey="cita" scale={0.5} className="h-[520px]" />
          </div>
        </motion.div>
      </section>

      {/* Pasos — stagger reveal al entrar en viewport. */}
      <section className="mx-auto max-w-5xl px-5 py-10">
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

      {/* Galería de plantillas — stagger reveal por scroll. */}
      <section id="plantillas" className="mx-auto max-w-5xl px-5 py-14">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center text-3xl font-bold"
        >
          Plantillas
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-2 text-center text-ink/60"
        >
          Un pago único por invitación.
        </motion.p>
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

      {/* Preview arrastrable: debajo de las plantillas, una sección alta con un
          sticky que "arrastra" el MiniPreview (escala + fade + translate) en
          función del scroll. Como está reversed en useTransform, scrollear hacia
          arriba deshace la animación. */}
      <section
        ref={revealRef}
        aria-label="Vista previa en vivo"
        className="relative h-[220vh]"
      >
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-5">
          <motion.div
            style={{ scale: previewScale, opacity: previewOpacity, y: previewY }}
            className="w-full max-w-5xl"
          >
            <div className="overflow-hidden rounded-[2.5rem] border-8 border-white bg-white shadow-2xl ring-1 ring-line">
              <MiniPreview
                templateKey="cumpleanos"
                scale={1}
                className="h-[75vh] md:h-[78vh]"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
