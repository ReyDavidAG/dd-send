"use client";

import { useState } from "react";

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

  async function pay() {
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
    </>
  );
}
