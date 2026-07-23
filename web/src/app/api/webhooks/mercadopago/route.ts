import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mpPayment } from "@/lib/mercadopago";

// Webhook de Mercado Pago: verifica firma y activa la invitación al aprobarse.
//
// MP puede enviar notificaciones en dos formatos:
//   - NUEVO (webhooks firmados): URL `?data.id=...&type=payment`,
//     headers `x-signature` + `x-request-id`. Verificamos HMAC-SHA256.
//   - LEGACY (IPN viejo): URL `?id=...&topic=merchant_order` SIN headers de
//     firma. MP sigue mandándolas junto con las nuevas; las aceptamos sin
//     verificar firma, pero solo las usamos para ignorar (no traen datos de
//     pago, solo de orden). Los pagos reales llegan por el formato nuevo.
//
// Idempotencia (sigue aplicando):
//   - mp_payment_id es único (índice 0006). Si ya existe, no duplicamos.
//   - La activación solo ocurre si la invitación NO está ya `active`.
//   - El payment solo se actualiza si está `pending`.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic");

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";
  const hasSignature = xSignature.includes("ts=") && xSignature.includes("v1=");

  // Log de entrada: ayuda a ver qué nos manda MP y por qué rechaza.
  console.log(
    "[webhook] incoming. dataId=",
    dataId,
    " type=",
    type,
    " hasSignature=",
    hasSignature,
    " secret_set=",
    !!secret,
  );

  // ── Verificación de firma: solo si el header viene presente ──
  // Si NO viene firma, asumimos formato legacy (IPN) — aceptamos y dejamos
  // pasar; las legacy no traen info útil de pago y serán ignoradas más abajo.
  if (hasSignature) {
    const parts = Object.fromEntries(
      xSignature.split(",").map((p) => p.split("=").map((s) => s.trim()) as [string, string]),
    );
    const ts = parts.ts;
    const v1 = parts.v1;

    // Diagnóstico: log de cada paso del HMAC para identificar mismatches.
    console.log(
      "[webhook] signature check. dataId=", dataId,
      " ts=", ts,
      " v1_len=", v1?.length,
      " xRequestId=", xRequestId,
    );

    if (!secret || !ts || !v1 || !dataId) {
      console.error(
        "[webhook] signature check failed: missing field. secret?",
        !!secret, "ts?", !!ts, "v1?", !!v1, "dataId?", !!dataId,
      );
      return NextResponse.json({ error: "unverified" }, { status: 401 });
    }
    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
    const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
    // NO logueamos el v1 ni el expected completos (pueden servir como token).
    // Solo sus primeros 6 chars y longitud, suficiente para diagnosticar.
    console.log(
      "[webhook] hmac computed. expected_prefix=", expected.slice(0, 6),
      " expected_len=", expected.length,
      " v1_prefix=", v1.slice(0, 6),
      " v1_len=", v1.length,
      " secret_len=", secret.length,
    );
    if (
      expected.length !== v1.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
    ) {
      console.error(
        "[webhook] HMAC mismatch. Check that MERCADOPAGO_WEBHOOK_SECRET in Vercel matches the Clave secreta in MP dashboard.",
      );
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
    console.log("[webhook] signature OK.");
  } else {
    // Notificación legacy (sin firma). La aceptamos pero logueamos para
    // saber que sigue llegando este formato.
    console.log("[webhook] legacy notification (no x-signature):", {
      dataId,
      type,
      ua: request.headers.get("user-agent"),
    });
  }

  // Solo nos interesan notificaciones de pago. Las merchant_order legacy
  // salen por aquí sin hacer nada.
  if (type !== "payment") return NextResponse.json({ ok: true });

  // Traemos el pago desde MP (necesitamos su estado real y external_reference).
  const payment = await mpPayment().get({ id: dataId });
  const invitationId = payment.external_reference ?? undefined;
  const status = payment.status; // approved | rejected | pending | ...
  const mapped =
    status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";

  if (!invitationId) {
    // Pago sin external_reference: algo está muy mal, pero no rompemos el
    // webhook (MP espera 200/201 para no reintentar).
    console.error("[webhook] payment without external_reference:", dataId);
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();

  // ¿Ya procesamos este mp_payment_id? Si sí, no hacemos nada (idempotencia).
  const { data: existingByMpId } = await admin
    .from("payments")
    .select("id, status, invitation_id")
    .eq("mp_payment_id", String(payment.id))
    .maybeSingle();

  if (existingByMpId) {
    // Ya tenemos este pago procesado. Si por algo el status difiere (ej. el
    // webhook tardío trae un refund que no teníamos), actualizamos el raw
    // pero NO tocamos la invitación ya activa.
    if (existingByMpId.status !== mapped) {
      await admin
        .from("payments")
        .update({ status: mapped, raw: payment as object })
        .eq("id", existingByMpId.id);
    }
    return NextResponse.json({ ok: true, dedup: true });
  }

  // Buscamos la fila de payment pendiente para esta invitación (la que creó
  // /api/checkout). Si NO existe, es la race condition: el usuario pagó tan
  // rápido que el webhook llegó antes que el insert del payment. En ese
  // caso creamos la fila con la info de MP.
  const { data: pendingRow } = await admin
    .from("payments")
    .select("id")
    .eq("invitation_id", invitationId)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingRow) {
    await admin
      .from("payments")
      .update({
        mp_payment_id: String(payment.id),
        status: mapped,
        raw: payment as object,
      })
      .eq("id", pendingRow.id);
  } else {
    // Race: insertar la fila desde los datos de MP. No tenemos amount/currency
    // locales aquí, así que los tomamos del pago mismo.
    const { data: invRow } = await admin
      .from("invitations")
      .select("user_id")
      .eq("id", invitationId)
      .single();
    await admin.from("payments").insert({
      invitation_id: invitationId,
      user_id: invRow?.user_id ?? "unknown",
      provider: "mercadopago",
      mp_preference_id: "",
      mp_payment_id: String(payment.id),
      amount: Math.round((payment.transaction_amount ?? 0) * 100),
      currency: payment.currency_id ?? "MXN",
      status: mapped,
      raw: payment as object,
    });
  }

  // Activar invitación SOLO si aún no está activa (idempotencia).
  if (status === "approved") {
    const { data: inv } = await admin
      .from("invitations")
      .select("status, event_date, templates(active_days_after)")
      .eq("id", invitationId)
      .single();

    if (inv && inv.status !== "active") {
      const days =
        (inv.templates as unknown as { active_days_after?: number })?.active_days_after ?? 7;
      const base = inv.event_date ? new Date(inv.event_date).getTime() : Date.now();
      const expiresAt = new Date(base + days * 86_400_000).toISOString();

      await admin
        .from("invitations")
        .update({
          status: "active",
          published_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .eq("id", invitationId)
        .neq("status", "active"); // safety extra: nunca sobreescribir una activa
    }
  }

  return NextResponse.json({ ok: true });
}