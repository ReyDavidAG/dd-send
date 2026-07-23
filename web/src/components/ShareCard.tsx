"use client";

import { useState } from "react";

// Tarjeta para mostrar el link público y darle al usuario opciones de
// compartir. La URL ya viene armada del server (incluye https://).
export function ShareCard({
  url,
  title,
  message,
}: {
  url: string;
  title: string;
  message: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores sin clipboard API
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const waText = encodeURIComponent(`${message}\n${url}`);
  const waUrl = `https://wa.me/?text=${waText}`;

  return (
    <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-line">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-ink/60">
          Comparte este enlace con tus invitados. La invitación está activa
          y pueden verla desde cualquier dispositivo.
        </p>
      </div>

      <div className="rounded-xl bg-sand p-3">
        <p className="break-all font-mono text-sm">{url}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={copy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-coral-deep"
        >
          {copied ? "✓ Copiado" : "📋 Copiar link"}
        </button>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-600"
        >
          💬 Compartir por WhatsApp
        </a>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-sm font-semibold text-coral-deep underline"
      >
        Ver cómo la ven tus invitados →
      </a>
    </div>
  );
}