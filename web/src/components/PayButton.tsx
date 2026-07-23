"use client";

import { useState } from "react";
import { PAYMENTS_ENABLED } from "@/lib/pricing";

// Mensajes de error por código HTTP. Cada caso tiene una explicación clara y
// una acción sugerida para que el usuario sepa qué hacer.
const errorMessages: Record<number, string> = {
  400: "Faltan datos para iniciar el pago.",
  401: "Tu sesión expiró. Vuelve a iniciar sesión para pagar.",
  404: "No encontramos esta invitación.",
  409: "Esta invitación ya está activa.",
  500: "No pudimos iniciar el pago. Intenta de nuevo en unos segundos.",
  502: "Mercado Pago no respondió. Intenta de nuevo en unos segundos.",
};

export function PayButton({
  invitationId,
  className,
  children,
}: {
  invitationId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  async function pay() {
    // Pagos aún sin configurar: mostramos "Próximamente" y no iniciamos checkout.
    if (!PAYMENTS_ENABLED) {
      setToast(true);
      setTimeout(() => setToast(false), 2600);
      return;
    }

    // Prevenir doble click mientras se redirige. El usuario puede volver si
    // falla, pero mientras loading es true, no se reenvía el request.
    if (loading) return;
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(errorMessages[res.status] ?? data.error ?? "No se pudo iniciar el pago.");
      }
      // Redirigir. NO resetear loading: el usuario ya no verá este botón.
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error de red. Revisa tu conexión.");
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={pay} disabled={loading} className={className}>
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Redirigiendo a pago…
          </span>
        ) : (
          children
        )}
      </button>
      {err && (
        <div className="mt-2 flex items-start gap-2 text-xs text-coral-deep">
          <span>⚠️</span>
          <span>{err}</span>
        </div>
      )}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <span className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand shadow-xl">
            🚧 Pagos próximamente
          </span>
        </div>
      )}
    </>
  );
}