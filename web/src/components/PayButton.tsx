"use client";

import { useState } from "react";
import { PAYMENTS_ENABLED } from "@/lib/pricing";

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
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "No se pudo iniciar el pago.");
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={pay} disabled={loading} className={className}>
        {loading ? "Redirigiendo…" : children}
      </button>
      {err && <span className="block text-xs text-coral-deep">{err}</span>}
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
