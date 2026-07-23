"use client";

import { useEffect, useState, useTransition } from "react";
import { checkPaymentStatus } from "@/app/actions/payments";
import { ShareCard } from "@/components/ShareCard";

// Pantalla post-pago. MP redirige aquí con ?invitation_id=X cuando el usuario
// aprueba (auto_return=approved) o elige "Volver al sitio" en success.
//
// El webhook puede tardar segundos en llegar (a veces más). Para que el
// usuario no vea "Pago pendiente" en el dashboard mientras tanto, esta
// pantalla hace polling al server action `checkPaymentStatus` con backoff
// y muestra el link compartible en cuanto se confirma la activación.
//
// Si tarda demasiado, ofrece un botón "Reintentar" en vez de quedar en loop.
export function CheckoutSuccessClient({
  invitationId,
  siteUrl,
  title,
  message,
}: {
  invitationId: string;
  siteUrl: string;
  title: string;
  message: string;
}) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "active"; url: string }
    | { kind: "pending"; reason: string }
    | { kind: "rejected" }
    | { kind: "error"; message: string }
  >({ kind: "loading" });
  const [pending, start] = useTransition();

  const poll = () => {
    start(async () => {
      try {
        const r = await checkPaymentStatus(invitationId);
        if (r.state === "active") {
          setState({ kind: "active", url: `${siteUrl}/i/${r.slug}` });
          return;
        }
        if (r.state === "rejected") {
          setState({ kind: "rejected" });
          return;
        }
        if (r.state === "not_found" || r.state === "forbidden") {
          setState({
            kind: "error",
            message:
              r.state === "not_found"
                ? "No encontramos esta invitación."
                : "No tienes permiso para verla.",
          });
          return;
        }
        setState({ kind: "pending", reason: r.reason });
      } catch (e) {
        setState({
          kind: "error",
          message: e instanceof Error ? e.message : "Error al verificar.",
        });
      }
    });
  };

  // Polling con backoff: cada 2s los primeros 30s, luego cada 4s hasta 90s.
  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    const tick = () => {
      if (cancelled) return;
      poll();
      attempt++;
      const delay = attempt < 15 ? 2000 : 4000;
      if (attempt < 25) setTimeout(tick, delay);
    };
    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationId]);

  if (state.kind === "loading" || state.kind === "pending") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-line">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-line border-t-coral" />
        <p className="mt-4 font-semibold">Confirmando tu pago…</p>
        <p className="mt-1 text-sm text-ink/60">
          Mercado Pago está procesando. Esto normalmente toma unos segundos.
        </p>
        {state.kind === "pending" && (
          <p className="mt-4 text-xs text-ink/40">
            Sigue tomando más de lo normal. Puedes esperar o reintentar.
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={poll}
            disabled={pending}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-sand disabled:opacity-60"
          >
            {pending ? "Verificando…" : "Reintentar"}
          </button>
          <a
            href="/dashboard"
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-sand"
          >
            Ir al dashboard
          </a>
        </div>
      </div>
    );
  }

  if (state.kind === "rejected") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-line">
        <div className="text-5xl">❌</div>
        <h2 className="mt-4 text-xl font-bold">El pago no se aprobó</h2>
        <p className="mt-2 text-sm text-ink/60">
          Mercado Pago rechazó el pago. Puedes volver al editor para intentarlo
          de nuevo con otro método.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <a
            href={`/dashboard`}
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-deep"
          >
            Volver al dashboard
          </a>
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-line">
        <div className="text-5xl">⚠️</div>
        <h2 className="mt-4 text-xl font-bold">Algo salió mal</h2>
        <p className="mt-2 text-sm text-ink/60">{state.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={poll}
            disabled={pending}
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-deep disabled:opacity-60"
          >
            {pending ? "Reintentando…" : "Reintentar"}
          </button>
          <a
            href="/dashboard"
            className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:bg-sand"
          >
            Ir al dashboard
          </a>
        </div>
      </div>
    );
  }

  // state.kind === "active"
  return (
    <>
      <div className="mb-6 rounded-2xl bg-green-50 p-5 text-center ring-1 ring-green-200">
        <div className="text-4xl">🎉</div>
        <h1 className="mt-2 text-2xl font-bold text-green-900">¡Pago confirmado!</h1>
        <p className="mt-1 text-sm text-green-800">
          Tu invitación está activa y lista para compartir.
        </p>
      </div>
      <ShareCard url={state.url} title={title} message={message} />
    </>
  );
}