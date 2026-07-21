"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { fontByKey } from "./fonts";
import { ConfettiOverlay } from "./ConfettiOverlay";
import { Reveal } from "./Reveal";
import { normalizeAnim } from "./animations";
import {
  DEFAULT_SECTIONS,
  SECTION_LABELS,
  type AnimationKey,
  type EditControls,
  type InvitationViewProps,
  type Palette,
  type SectionId,
} from "./types";

// ¿El enlace es un mapa/ubicación? (Google Maps, goo.gl/maps, maps.app…)
function isMapLink(url: string): boolean {
  return /google\.[^/]+\/maps|maps\.google|goo\.gl\/maps|maps\.app/i.test(url || "");
}

// src del iframe: usa las coordenadas del enlace si las trae (!3d/!4d o @lat,lng);
// si no, cae al texto del lugar. Así el pin queda en la dirección real.
function mapEmbedSrc(link: string, label: string): string {
  const m = link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const q = m ? `${m[1]},${m[2]}` : label || link;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
}

export function InvitationView({ content, palette, style, animate = true, edit }: InvitationViewProps) {
  const anim = normalizeAnim(content.animationKey);
  const on = animate && anim !== "ninguna";
  // En modo edición no se ocultan/animan secciones: se ven todas para gestionarlas.
  // Fuera de edición, si no se anima (mini-preview) también va plano.
  const rev: AnimationKey = edit || !animate ? "ninguna" : anim;

  const font = fontByKey(content.fontKey);
  const vars = {
    "--c-bg": palette.bg,
    "--c-surface": palette.surface,
    "--c-text": palette.text,
    "--c-accent": palette.accent,
    "--c-accent-deep": palette.accentDeep,
    "--c-band": palette.band,
    "--c-fh": font.head,
    "--c-fb": font.body,
    "--c-fw": content.headingWeight || "700",
    fontFamily: "var(--c-fb)",
  } as CSSProperties;

  const head = "[font-family:var(--c-fh)] [font-weight:var(--c-fw)]";
  const sections = content.sections?.length ? content.sections : DEFAULT_SECTIONS;

  const render = (id: SectionId) => {
    switch (id) {
      case "hero":
        return <Hero content={content} variant={style.hero} head={head} palette={palette} animated={on} rev={rev} />;
      case "message":
        return (
          <section className="px-6 py-20 sm:py-28">
            <Reveal anim={rev} className="mx-auto max-w-xl text-center">
              <p className={`${head} text-3xl text-[var(--c-accent-deep)] sm:text-4xl`}>{content.title}</p>
              <p className="mt-8 text-xl leading-relaxed sm:text-2xl">{content.message}</p>
              {content.signature && (
                <p className={`${head} mt-8 text-2xl text-[var(--c-accent-deep)]`}>{content.signature}</p>
              )}
            </Reveal>
          </section>
        );
      case "photos":
        if (!content.photos.length) return null;
        return (
          <section className="px-6 pb-16">
            <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-3">
              {content.photos.map((src, i) => (
                <Reveal key={i} anim={rev} delay={i * 0.08} className={i === 1 ? "sm:mt-8" : ""}>
                  <img
                    src={src}
                    alt={`Foto ${i + 1}`}
                    loading="lazy"
                    className="aspect-[3/4] w-full rounded-2xl border-4 border-[var(--c-surface)] object-cover shadow-lg"
                  />
                </Reveal>
              ))}
            </div>
          </section>
        );
      case "details":
        return (
          <section className="bg-[var(--c-band)] px-6 py-20 sm:py-28">
            <Reveal anim={rev} className="mx-auto max-w-lg text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--c-accent-deep)]">Detalles</p>
              <dl className="mt-8 space-y-6 text-lg">
                <div>
                  <dt className={`${head} text-2xl text-[var(--c-accent-deep)]`}>Evento</dt>
                  <dd className="text-2xl">{content.eventName}</dd>
                </div>
                <div>
                  <dt className={`${head} text-2xl text-[var(--c-accent-deep)]`}>Cuándo</dt>
                  <dd className="text-2xl">{content.eventDateLabel}</dd>
                </div>
              </dl>
              {content.locationLabel &&
                (isMapLink(content.locationLink) ? (
                  // Ubicación: mapa embebido + enlace directo a Maps.
                  <div className="mt-8">
                    <p className="text-2xl text-[var(--c-accent-deep)]">{content.locationLabel}</p>
                    <iframe
                      title="Mapa de la ubicación"
                      src={mapEmbedSrc(content.locationLink, content.locationLabel)}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="mt-4 h-64 w-full rounded-2xl border-4 border-[var(--c-surface)] shadow-lg"
                    />
                    <a
                      href={content.locationLink}
                      target="_blank"
                      rel="noopener"
                      className="mt-4 inline-block rounded-full bg-[var(--c-text)] px-8 py-4 text-lg font-semibold text-[var(--c-bg)] transition hover:bg-[var(--c-accent-deep)]"
                    >
                      Cómo llegar
                    </a>
                  </div>
                ) : content.locationLink ? (
                  <a
                    href={content.locationLink}
                    target="_blank"
                    rel="noopener"
                    className="mt-10 inline-block rounded-full bg-[var(--c-text)] px-8 py-4 text-lg font-semibold text-[var(--c-bg)] transition hover:bg-[var(--c-accent-deep)]"
                  >
                    {content.locationLabel}
                  </a>
                ) : (
                  <p className="mt-10 text-2xl text-[var(--c-accent-deep)]">{content.locationLabel}</p>
                ))}
            </Reveal>
          </section>
        );
      case "countdown":
        return <Countdown iso={content.eventDate} head={head} />;
      case "rsvp":
        return <Rsvp whatsapp={content.rsvpWhatsapp} message={content.rsvpMessage} head={head} rev={rev} />;
    }
  };

  // En edición se listan todas (para reordenar/mostrar); publicada, solo visibles.
  const shown = edit ? sections : sections.filter((s) => s.visible);

  return (
    <div style={vars} className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      {shown.map((s, i) => {
        const body = render(s.id);
        return (
          <div id={`sec-${s.id}`} key={s.id} className="relative">
            {edit && (
              <SectionToolbar
                id={s.id}
                visible={s.visible}
                first={i === 0}
                last={i === shown.length - 1}
                edit={edit}
              />
            )}
            {/* En edición el contenido no es interactivo: los botones/enlaces de la
                plantilla (RSVP, mapa…) no se disparan; solo la toolbar de gestión.
                Si la sección aún no tiene contenido, se muestra un placeholder con
                alto mínimo para que las toolbars no se encimen. */}
            <div
              className={`${edit ? "pointer-events-none select-none" : ""} ${
                edit && !s.visible ? "opacity-40 grayscale" : ""
              }`}
            >
              {edit && body == null ? <EmptySection id={s.id} /> : body}
            </div>
          </div>
        );
      })}
      <footer className="py-10 text-center text-sm opacity-60">Hecho con 💕 · {content.fromName}</footer>
    </div>
  );
}

// Qué falta por completar en cada sección (placeholder de edición).
const EMPTY_HINT: Record<SectionId, string> = {
  hero: "Agrega un encabezado o una foto de portada.",
  message: "Escribe el título y el mensaje.",
  photos: "Sube al menos una foto.",
  details: "Completa los detalles del evento.",
  countdown: "Define la fecha y hora del evento.",
  rsvp: "Agrega un WhatsApp para confirmar asistencia.",
};

// Placeholder para secciones sin contenido (solo en edición): reserva alto para
// que la toolbar no se encime con las secciones vecinas.
function EmptySection({ id }: { id: SectionId }) {
  return (
    <div className="px-4 py-4">
      <div
        className="grid min-h-[96px] place-items-center rounded-2xl border-2 border-dashed px-6 py-6 text-center"
        style={{ borderColor: "var(--c-text)", opacity: 0.5 }}
      >
        <div>
          <p className="text-sm font-semibold">{SECTION_LABELS[id]}</p>
          <p className="mt-1 text-xs">{EMPTY_HINT[id]}</p>
        </div>
      </div>
    </div>
  );
}

// Barra flotante de control por sección (solo en el preview del editor).
function SectionToolbar({
  id,
  visible,
  first,
  last,
  edit,
}: {
  id: SectionId;
  visible: boolean;
  first: boolean;
  last: boolean;
  edit: EditControls;
}) {
  const btn =
    "grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-ink shadow ring-1 ring-black/5 backdrop-blur transition hover:bg-white disabled:opacity-30";
  return (
    <div className="absolute right-3 top-3 z-30 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-end gap-1.5">
      <span className="mr-1 hidden truncate rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow ring-1 ring-black/5 backdrop-blur sm:inline-block">
        {SECTION_LABELS[id]}
      </span>
      <button type="button" onClick={() => edit.onMove(id, -1)} disabled={first} className={btn} aria-label="Subir sección">
        ↑
      </button>
      <button type="button" onClick={() => edit.onMove(id, 1)} disabled={last} className={btn} aria-label="Bajar sección">
        ↓
      </button>
      <button
        type="button"
        onClick={() => edit.onToggle(id)}
        className={btn}
        aria-label={visible ? "Ocultar sección" : "Mostrar sección"}
        title={visible ? "Ocultar" : "Mostrar"}
      >
        {visible ? "👁" : "🚫"}
      </button>
    </div>
  );
}

function Hero({
  content,
  variant,
  head,
  palette,
  animated,
  rev,
}: {
  content: InvitationViewProps["content"];
  variant: "photo" | "split" | "festive";
  head: string;
  palette: Palette;
  animated: boolean;
  rev: AnimationKey;
}) {
  const names = content.headline || `${content.fromName} & ${content.toName}`;
  // Colores del confetti (hero festivo): la paleta + dorado y blanco de fiesta.
  const confettiColors = useMemo(
    () => [palette.accent, palette.accentDeep, palette.surface, "#FFD84D", "#FFFFFF"],
    [palette.accent, palette.accentDeep, palette.surface],
  );

  if (variant === "split") {
    return (
      <header className="grid min-h-[80vh] items-center gap-8 px-6 py-16 md:grid-cols-2">
        <Reveal anim={rev} className="order-2 text-center md:order-1 md:text-left">
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--c-accent-deep)]">{content.title}</p>
          <h1 className={`${head} mt-4 text-5xl leading-tight sm:text-6xl`}>{names}</h1>
        </Reveal>
        <div className="order-1 md:order-2">
          {content.photos[0] ? (
            <img
              src={content.photos[0]}
              alt=""
              className="mx-auto aspect-[3/4] w-full max-w-sm rounded-3xl object-cover shadow-2xl"
            />
          ) : (
            <div className="mx-auto aspect-[3/4] w-full max-w-sm rounded-3xl bg-[var(--c-band)]" />
          )}
        </div>
      </header>
    );
  }

  if (variant === "festive") {
    // Hero festivo (cumpleaños): foto de fondo (si hay) con velo de la paleta +
    // confetti animado en canvas (sin emojis). Sin foto usa el gradiente festivo.
    // Solo cumpleaños usa esta variante, así que no afecta a las demás.
    const photo = content.photos[0];
    return (
      <header
        className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center text-[var(--c-bg)]"
        style={{
          backgroundImage: `radial-gradient(circle at 22% 28%, rgba(255,255,255,0.20), transparent 38%), radial-gradient(circle at 78% 72%, rgba(255,255,255,0.14), transparent 38%), linear-gradient(135deg, var(--c-accent), var(--c-accent-deep))`,
        }}
      >
        {photo && (
          <>
            <img
              src={photo}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Velo con los colores de la paleta para que el texto resalte. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 72%, transparent), color-mix(in srgb, var(--c-accent-deep) 78%, transparent))`,
              }}
            />
          </>
        )}
        {animated && <ConfettiOverlay colors={confettiColors} />}
        <Reveal anim={rev} className="relative z-10">
          <p className="text-sm uppercase tracking-[0.35em]">{content.title}</p>
          <h1 className={`${head} mt-3 text-5xl sm:text-7xl`}>{names}</h1>
        </Reveal>
      </header>
    );
  }

  // photo (default)
  return (
    <header className="relative flex h-[85vh] items-center justify-center overflow-hidden text-center">
      {content.photos[0] && (
        <img
          src={content.photos[0]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <Reveal anim={rev} className="relative px-6 text-white drop-shadow-lg">
        <p className="text-sm uppercase tracking-[0.35em]">{content.title}</p>
        <h1 className={`${head} mt-4 text-5xl sm:text-7xl`}>{names}</h1>
      </Reveal>
    </header>
  );
}

function Countdown({ iso, head }: { iso: string; head: string }) {
  const target = iso ? new Date(iso).getTime() : 0;
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!target) return;
    const tick = () => setLeft(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;

  const done = left !== null && left <= 0;
  const s = Math.max(0, Math.floor((left ?? 0) / 1000));
  const cells: [string, number][] = [
    ["días", Math.floor(s / 86400)],
    ["hrs", Math.floor((s % 86400) / 3600)],
    ["min", Math.floor((s % 3600) / 60)],
    ["seg", s % 60],
  ];

  return (
    <section className="px-6 py-20 text-center sm:py-28">
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--c-accent-deep)]">Falta poco</p>
      {done ? (
        <p className={`${head} mt-8 text-4xl text-[var(--c-accent-deep)]`}>¡Es hoy! 🎉</p>
      ) : (
        <div className="mx-auto mt-8 flex max-w-md justify-center gap-4 sm:gap-6">
          {cells.map(([label, value]) => (
            <div
              key={label}
              className="flex-1 rounded-2xl bg-[var(--c-text)] px-2 py-4 text-[var(--c-bg)] shadow-lg"
            >
              <span className={`${head} block text-3xl sm:text-4xl`}>
                {left === null ? "--" : String(value).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase tracking-widest opacity-80">{label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Rsvp({ whatsapp, message, head, rev }: { whatsapp: string; message: string; head: string; rev: AnimationKey }) {
  const layer = useRef<HTMLDivElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  if (!whatsapp) return null;

  const waUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  const hearts = ["💕", "💖", "❤️", "🌹", "🎉", "🥳"];

  const onClick = () => {
    const host = layer.current;
    if (host) {
      for (let i = 0; i < 24; i++) {
        const h = document.createElement("span");
        h.textContent = hearts[i % hearts.length];
        h.style.cssText = `position:absolute;bottom:-2rem;font-size:2rem;left:${Math.random() * 100}%;animation:invita-float-up ${2 + Math.random() * 2}s linear ${Math.random() * 0.6}s forwards`;
        host.appendChild(h);
        setTimeout(() => h.remove(), 4000);
      }
    }
    setConfirmed(true);
    setTimeout(() => window.open(waUrl, "_blank", "noopener"), 700);
  };

  return (
    <section className="relative overflow-hidden bg-[var(--c-band)] px-6 py-24 text-center sm:py-32">
      <Reveal anim={rev}>
        <h2 className={`${head} text-4xl sm:text-5xl`}>¿Confirmas?</h2>
        <button
          type="button"
          onClick={onClick}
          className="mt-10 rounded-full bg-[var(--c-accent-deep)] px-10 py-5 text-xl font-semibold text-[var(--c-bg)] shadow-xl transition hover:bg-[var(--c-text)]"
        >
          {confirmed ? "¡Nos vemos! 💕" : "Confirmar asistencia 💕"}
        </button>
      </Reveal>
      <div ref={layer} className="pointer-events-none absolute inset-0 overflow-hidden" />
      <style>{`@keyframes invita-float-up{0%{transform:translateY(0) scale(.6);opacity:1}100%{transform:translateY(-120vh) scale(1.4);opacity:0}}`}</style>
    </section>
  );
}
