"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { PAYMENTS_ENABLED, offerPriceCents, mxn } from "@/lib/pricing";
import { IconLock } from "@/components/icons";

// Mensajes de error por código HTTP: qué pasó + qué hacer.
const errorMessages: Record<number, string> = {
  400: "Faltan datos para iniciar el pago.",
  401: "Tu sesión expiró. Vuelve a iniciar sesión para pagar.",
  404: "No encontramos esta invitación.",
  409: "Esta invitación ya está activa.",
  500: "No pudimos iniciar el pago. Intenta de nuevo en unos segundos.",
  502: "Mercado Pago no respondió. Intenta de nuevo en unos segundos.",
};

const MP_BLUE = "#009ee3"; // azul de marca de Mercado Pago (alusión)

// Marca "Mercado Pago" para dejar claro al usuario quién procesa el pago.
function MercadoPagoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${className}`} style={{ color: MP_BLUE }}>
      <span
        className="grid h-4 w-4 place-items-center rounded-full text-[10px] text-white"
        style={{ background: MP_BLUE }}
      >
        $
      </span>
      Mercado&nbsp;Pago
    </span>
  );
}

export function PayButton({
  invitationId,
  className,
  children,
  basePriceCents = 0, // con la oferta de lanzamiento el precio es plano; ver pricing.ts
}: {
  invitationId: string;
  className?: string;
  children: React.ReactNode;
  basePriceCents?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const priceLabel = mxn(offerPriceCents(basePriceCents));

  async function pay() {
    if (loading) return; // evita doble submit
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
      // Redirige a Mercado Pago. No reseteamos loading: la página se va a ir.
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error de red. Revisa tu conexión.");
      setLoading(false);
    }
  }

  // Pagos aún sin configurar: toast "Próximamente", sin diálogo ni checkout.
  if (!PAYMENTS_ENABLED) {
    return (
      <>
        <button
          onClick={() => {
            setToast(true);
            setTimeout(() => setToast(false), 2600);
          }}
          className={className}
        >
          {children}
        </button>
        {toast && (
          <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
            <span className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand shadow-xl">
              🚧 Pronto podrás pagar con Mercado Pago
            </span>
          </div>
        )}
      </>
    );
  }

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className={className}>{children}</AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dd-overlay fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <AlertDialog.Content className="dd-content fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="p-6">
            <AlertDialog.Title className="text-lg font-bold">Publicar tu invitación</AlertDialog.Title>
            <AlertDialog.Description className="mt-1 text-sm text-ink/60">
              Un solo pago y tu invitación queda activa para compartir.
            </AlertDialog.Description>

            {/* Resumen de precio */}
            <div className="mt-4 flex items-baseline justify-between rounded-xl bg-lilac/50 px-4 py-3">
              <span className="text-sm font-medium text-ink/70">Total a pagar</span>
              <span className="text-2xl font-extrabold text-coral-deep">{priceLabel}</span>
            </div>

            {/* Nota de pago seguro + marca MP */}
            <div className="mt-3 flex items-start gap-2 text-xs text-ink/60">
              <IconLock className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <p>
                Pago seguro procesado por <MercadoPagoMark className="text-xs" />. Aceptas tarjeta,
                débito o efectivo. No guardamos los datos de tu tarjeta.
              </p>
            </div>

            {err && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-coral/10 px-3 py-2 text-xs text-coral-deep">
                <span>⚠️</span>
                <span>{err} Puedes intentar de nuevo.</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line bg-sand/50 px-6 py-4">
            <AlertDialog.Cancel
              disabled={loading}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-white disabled:opacity-60"
            >
              Ahora no
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={(e) => {
                e.preventDefault(); // que corra el fetch antes de cerrar
                void pay();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-70"
              style={{ background: MP_BLUE }}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Redirigiendo a Mercado Pago…
                </>
              ) : (
                <>
                  <IconLock className="h-4 w-4" /> Continuar a Mercado Pago
                </>
              )}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
