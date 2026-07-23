"use client";

import { useEffect, useState } from "react";

// Banner que aparece cuando vienes de vuelta de un pago. Se auto-cierra a
// los 12 segundos. Muestra CTAs claros según el estado.
export function DashboardSuccessBanner({
  invitationId,
  invitationSlug,
  title,
}: {
  invitationId: string;
  invitationSlug: string;
  title: string;
}) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 12_000);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const url = `${site}/i/${invitationSlug}`;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl bg-green-50 p-4 ring-1 ring-green-200">
      <div className="text-2xl">🎉</div>
      <div className="flex-1">
        <p className="font-semibold text-green-900">¡Pago confirmado!</p>
        <p className="mt-0.5 text-sm text-green-800">
          «{title}» está activa. Comparte el link con tus invitados.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`/checkout/success?invitation_id=${invitationId}`}
            className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
          >
            Ver link para compartir →
          </a>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full border border-green-300 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}