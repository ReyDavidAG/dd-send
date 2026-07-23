"use client";

import { useEffect, useState, useTransition } from "react";
import { checkPaymentStatus } from "@/app/actions/payments";
import { ShareCard } from "@/components/ShareCard";

// Pantalla post-pago. Mercado Pago redirige aquí con ?invitation_id=X cuando
// el usuario aprueba (auto_return=approved).
//
// Diseño: UN solo check diferido (2s para dar tiempo al webhook), sin
// botones de reintentar ni loop infinito. Si ya está activa → ShareCard.
// Si sigue pending → mensaje claro + CTA al dashboard (el webhook o el
// polling del propio dashboard se encargarán). Sin confusión.
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
    | { kind: "checking" }
    | { kind: "active"; url: string }
    | { kind: "pending" }
    | { kind: "rejected" }
    | { kind: "error"; message: string }
  >({ kind: "checking" });
  const [, start] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      start(async () => {
        try {
          const r = await checkPaymentStatus(invitationId);
          if (r.state === "active") {
            setState({ kind: "active", url: `${siteUrl}/i/${r.slug}` });
          } else if (r.state === "rejected") {
            setState({ kind: "rejected" });
          } else if (r.state === "not_found" || r.state === "forbidden") {
            setState({
              kind: "error",
              message:
                r.state === "not_found"
                  ? "No encontramos esta invitación."
                  : "No tienes permiso para verla.",
            });
          } else {
            setState({ kind: "pending" });
          }
        } catch (e) {
          setState({
            kind: "error",
            message: e instanceof Error ? e.message : "Error al verificar.",
          });
        }
      });
    }, 2000); // 2s de gracia para que el webhook llegue
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationId]);

  if (state.kind === "checking") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-line">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-line border-t-coral" />
        <p className="mt-4 font-semibold">Confirmando tu pago…</p>
        <p className="mt-1 text-sm text-ink/60">
          Mercado Pago está procesando tu pago. Esto normalmente toma unos
          segundos.
        </p>
      </div>
    );
  }

  if (state.kind === "active") {
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

  if (state.kind === "rejected") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-line">
        <div className="text-5xl">❌</div>
        <h2 className="mt-4 text-xl font-bold">El pago no se aprobó</h2>
        <p className="mt-2 text-sm text-ink/60">
          Mercado Pago rechazó el pago. Tu borrador sigue guardado en el
          dashboard, puedes intentarlo de nuevo con otro método.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-deep"
        >
          Ir al dashboard
        </a>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-line">
        <div className="text-5xl">⚠️</div>
        <h2 className="mt-4 text-xl font-bold">Algo salió mal</h2>
        <p className="mt-2 text-sm text-ink/60">{state.message}</p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-deep"
        >
          Ir al dashboard
        </a>
      </div>
    );
  }

  // state.kind === "pending" — el webhook aún no llegó. Sin reintentos.
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-line">
      <div className="text-5xl">⏳</div>
      <h2 className="mt-4 text-xl font-bold">Tu pago se está procesando</h2>
      <p className="mt-2 text-sm text-ink/60">
        Mercado Pago aceptó el pago y está confirmándolo. En cuanto termine,
        tu invitación aparecerá como <strong>Activa</strong> en el dashboard y
        te enviaremos el link para compartir.
      </p>
      <p className="mt-3 text-xs text-ink/40">
        Normalmente tarda menos de 30 segundos.
      </p>
      <a
        href="/dashboard"
        className="mt-6 inline-block rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-deep"
      >
        Ir al dashboard
      </a>
    </div>
  );
}