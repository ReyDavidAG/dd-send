import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mpPayment } from "@/lib/mercadopago";

// Webhook de Mercado Pago: verifica la firma y activa la invitación al aprobarse.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic");

  // ── Verificación de firma (x-signature: "ts=...,v1=...") ──
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=").map((s) => s.trim()) as [string, string]),
  );
  const ts = parts.ts;
  const v1 = parts.v1;

  if (!secret || !ts || !v1 || !dataId) {
    return NextResponse.json({ error: "unverified" }, { status: 401 });
  }
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  if (
    expected.length !== v1.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
  ) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Solo nos interesan notificaciones de pago.
  if (type !== "payment") return NextResponse.json({ ok: true });

  const payment = await mpPayment().get({ id: dataId });
  const invitationId = payment.external_reference ?? undefined;
  const status = payment.status; // approved | rejected | pending | ...
  if (!invitationId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();

  const mapped =
    status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";
  await admin
    .from("payments")
    .update({ mp_payment_id: String(payment.id), status: mapped, raw: payment as object })
    .eq("invitation_id", invitationId)
    .eq("status", "pending");

  if (status === "approved") {
    // expires_at = fecha del evento (o ahora) + active_days_after de la plantilla.
    const { data: inv } = await admin
      .from("invitations")
      .select("event_date, templates(active_days_after)")
      .eq("id", invitationId)
      .single();
    const days = (inv?.templates as unknown as { active_days_after?: number })?.active_days_after ?? 7;
    const base = inv?.event_date ? new Date(inv.event_date).getTime() : Date.now();
    const expiresAt = new Date(base + days * 86_400_000).toISOString();

    await admin
      .from("invitations")
      .update({ status: "active", published_at: new Date().toISOString(), expires_at: expiresAt })
      .eq("id", invitationId);
  }

  return NextResponse.json({ ok: true });
}
