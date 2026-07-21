"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useScrollReveal } from "./hooks/useScrollReveal";
import { fontByKey } from "./fonts";
import { DEFAULT_SECTIONS, type InvitationViewProps, type SectionId } from "./types";

export function InvitationView({ content, palette, style, animate = true }: InvitationViewProps) {
  const anim = content.animationKey ?? "suave";
  const on = animate && anim !== "ninguna";
  const scope = useScrollReveal(on, anim === "dinamica" ? 1.4 : 0.8);

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
    fontFamily: "var(--c-fb)",
  } as CSSProperties;

  const head = "[font-family:var(--c-fh)]";
  const sections = content.sections?.length ? content.sections : DEFAULT_SECTIONS;

  const render = (id: SectionId) => {
    switch (id) {
      case "hero":
        return <Hero content={content} variant={style.hero} head={head} />;
      case "message":
        return (
          <section className="px-6 py-20 sm:py-28">
            <div data-reveal className="mx-auto max-w-xl text-center">
              <p className={`${head} text-3xl text-[var(--c-accent-deep)] sm:text-4xl`}>{content.title}</p>
              <p className="mt-8 text-xl leading-relaxed sm:text-2xl">{content.message}</p>
              {content.signature && (
                <p className={`${head} mt-8 text-2xl text-[var(--c-accent-deep)]`}>{content.signature}</p>
              )}
            </div>
          </section>
        );
      case "photos":
        if (!content.photos.length) return null;
        return (
          <section className="px-6 pb-16">
            <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-3">
              {content.photos.map((src, i) => (
                <img
                  key={i}
                  data-reveal
                  data-reveal-y="80"
                  src={src}
                  alt={`Foto ${i + 1}`}
                  loading="lazy"
                  className={`aspect-[3/4] w-full rounded-2xl border-4 border-[var(--c-surface)] object-cover shadow-lg ${
                    i === 1 ? "sm:mt-8" : ""
                  }`}
                />
              ))}
            </div>
          </section>
        );
      case "details":
        return (
          <section className="bg-[var(--c-band)] px-6 py-20 sm:py-28">
            <div data-reveal data-reveal-x="-80" className="mx-auto max-w-lg text-center">
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
                (content.locationLink ? (
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
            </div>
          </section>
        );
      case "countdown":
        return <Countdown iso={content.eventDate} head={head} />;
      case "rsvp":
        return <Rsvp whatsapp={content.rsvpWhatsapp} message={content.rsvpMessage} head={head} />;
    }
  };

  return (
    <div ref={scope} style={vars} className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      {sections
        .filter((s) => s.visible)
        .map((s) => (
          <div id={`sec-${s.id}`} key={s.id}>
            {render(s.id)}
          </div>
        ))}
      <footer className="py-10 text-center text-sm opacity-60">Hecho con 💕 · {content.fromName}</footer>
    </div>
  );
}

function Hero({
  content,
  variant,
  head,
}: {
  content: InvitationViewProps["content"];
  variant: "photo" | "split" | "festive";
  head: string;
}) {
  const names = content.headline || `${content.fromName} & ${content.toName}`;

  if (variant === "split") {
    return (
      <header className="grid min-h-[80vh] items-center gap-8 px-6 py-16 md:grid-cols-2">
        <div className="order-2 text-center md:order-1 md:text-left">
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--c-accent-deep)]">{content.title}</p>
          <h1 className={`${head} mt-4 text-5xl leading-tight sm:text-6xl`}>{names}</h1>
        </div>
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
    // Hero festivo (cumpleaños): balloons flotando + 🎂 rebotando + brillos.
    // Solo cumpleaños usa esta variante, así que las decoraciones no afectan a las demás.
    return (
      <header
        className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center text-[var(--c-bg)]"
        style={{
          backgroundImage: `radial-gradient(circle at 22% 28%, rgba(255,255,255,0.20), transparent 38%), radial-gradient(circle at 78% 72%, rgba(255,255,255,0.14), transparent 38%), linear-gradient(135deg, var(--c-accent), var(--c-accent-deep))`,
        }}
      >
        {/* Decoraciones (solo visuales, aria-hidden, sin pointer-events). */}
        <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
          <span className="dd-anim-balloon absolute left-[6%] top-[18%] text-4xl sm:left-[12%] sm:top-[24%] sm:text-6xl">🎈</span>
          <span className="dd-anim-balloon-d absolute right-[6%] top-[22%] text-4xl sm:right-[12%] sm:top-[18%] sm:text-6xl">🎈</span>
          <span className="dd-anim-balloon-d absolute bottom-[16%] left-[8%] hidden text-3xl sm:block sm:text-5xl">🎁</span>
          <span className="dd-anim-balloon absolute bottom-[22%] right-[10%] hidden text-3xl sm:block sm:text-5xl">🎁</span>
          <span className="dd-anim-twinkle absolute left-1/2 top-[8%] -translate-x-1/2 text-xl sm:text-2xl">✨</span>
          <span className="dd-anim-twinkle absolute left-[18%] bottom-[28%] hidden text-lg sm:block">⭐</span>
          <span className="dd-anim-twinkle absolute right-[20%] bottom-[30%] hidden text-lg sm:block">⭐</span>
        </div>
        <div className="dd-anim-bounce text-6xl sm:text-7xl" aria-hidden>🎂</div>
        <p className="mt-6 text-sm uppercase tracking-[0.35em]">{content.title}</p>
        <h1 className={`${head} mt-3 text-5xl sm:text-7xl`}>{names}</h1>
      </header>
    );
  }

  // photo (default)
  return (
    <header className="relative flex h-[85vh] items-center justify-center overflow-hidden text-center">
      {content.photos[0] && (
        <img
          data-parallax
          src={content.photos[0]}
          alt=""
          className="absolute inset-0 h-[120%] w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative px-6 text-white drop-shadow-lg">
        <p className="text-sm uppercase tracking-[0.35em]">{content.title}</p>
        <h1 className={`${head} mt-4 text-5xl font-bold sm:text-7xl`}>{names}</h1>
      </div>
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

function Rsvp({ whatsapp, message, head }: { whatsapp: string; message: string; head: string }) {
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
      <div data-reveal>
        <h2 className={`${head} text-4xl sm:text-5xl`}>¿Confirmas?</h2>
        <button
          type="button"
          onClick={onClick}
          className="mt-10 rounded-full bg-[var(--c-accent-deep)] px-10 py-5 text-xl font-semibold text-[var(--c-bg)] shadow-xl transition hover:bg-[var(--c-text)]"
        >
          {confirmed ? "¡Nos vemos! 💕" : "Confirmar asistencia 💕"}
        </button>
      </div>
      <div ref={layer} className="pointer-events-none absolute inset-0 overflow-hidden" />
      <style>{`@keyframes invita-float-up{0%{transform:translateY(0) scale(.6);opacity:1}100%{transform:translateY(-120vh) scale(1.4);opacity:0}}`}</style>
    </section>
  );
}
