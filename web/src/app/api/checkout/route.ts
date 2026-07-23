import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { mpPreference } from "@/lib/mercadopago";
import { offerPriceCents } from "@/lib/pricing";

// Endpoint idempotente para crear la preferencia de Checkout Pro.
//
// Reglas para NO cobrar doble ni dejar pagos colgados:
// 1. Si ya existe un payment PENDING para esta invitación, devolvemos su
//    init_point guardado sin crear uno nuevo. El índice único parcial
//    `payments_one_pending_per_invitation` garantiza que solo hay una fila
//    pending por invitación (ver migration 0006).
// 2. Si la invitación ya está activa, devolvemos 409 — no se cobra de nuevo.
// 3. Flujo: crear preference en MP → insertar payment (pending) → marcar
//    invitación. Si falla la preference, no tocamos la BD. Si falla el
//    insert del payment por unique violation (otro tab creó uno entre
//    tanto), recuperamos su init_point en vez de cobrar doble.
// 4. back_urls apuntan a páginas dedicadas (success/failure/pending).
export async function POST(request: Request) {
  const { invitationId } = await request.json().catch(() => ({}));
  if (!invitationId) {
    return NextResponse.json({ error: "Falta invitationId" }, { status: 400 });
  }

  // 1) Verificar sesión (Auth0).
  const user = await getSessionUser();
  if (!user?.sub) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invitations")
    .select("id, user_id, status, template_id, content, templates(name, base_price, currency)")
    .eq("id", invitationId)
    .single();

  if (!inv || inv.user_id !== user.sub) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  }
  if (inv.status === "active") {
    return NextResponse.json(
      { error: "La invitación ya está activa" },
      { status: 409 },
    );
  }

  // 2) Reusar init_point pendiente si ya existe (doble click, refresh, retry).
  const { data: existing } = await admin
    .from("payments")
    .select("id, init_point")
    .eq("invitation_id", inv.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing?.init_point) {
    return NextResponse.json({ url: existing.init_point, reused: true });
  }

  const tpl = inv.templates as unknown as {
    name: string;
    base_price: number;
    currency: string;
  };
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const price = offerPriceCents(tpl.base_price);

  // 3) Crear la preference. Si falla, no tocamos la BD.
  let prefId = "";
  let initPoint = "";
  try {
    // Log: qué le mandamos a MP. No incluye secretos. Útil para diagnosticar
    // rechazos ("Algo salió mal" en la UI de MP = MP rechazó la preference).
    const mpBody = {
      items: [
        {
          id: inv.template_id,
          title: `Invitación · ${tpl.name}`,
          quantity: 1,
          unit_price: price / 100,
          currency_id: tpl.currency,
        },
      ],
      external_reference: inv.id,
      back_urls: {
        success: `${site}/checkout/success?invitation_id=${inv.id}`,
        failure: `${site}/checkout/failure?invitation_id=${inv.id}`,
        pending: `${site}/checkout/pending?invitation_id=${inv.id}`,
      },
      auto_return: "approved",
      notification_url: `${site}/api/webhooks/mercadopago`,
    };
    console.log(
      "[checkout] creating MP preference. site=",
      site,
      " invitationId=",
      inv.id,
      " price=",
      price,
      " body=",
      JSON.stringify(mpBody),
    );

    const pref = await mpPreference().create({ body: mpBody });
    prefId = pref.id ?? "";
    initPoint = pref.init_point ?? "";
    if (!prefId || !initPoint) {
      throw new Error("MP returned empty preference id or init_point");
    }
    console.log("[checkout] MP preference OK. prefId=", prefId);
  } catch (e: unknown) {
    // El SDK hace `throw await response.json()` ante no-2xx, así que `e` es
    // el JSON crudo que devolvió MP. Lo serializamos entero para diagnóstico.
    const errPayload =
      e instanceof Error
        ? { message: e.message, stack: e.stack, raw: e }
        : e;
    console.error(
      "[checkout] MP preference failed. site=",
      site,
      " payload=",
      JSON.stringify(errPayload),
    );
    return NextResponse.json(
      { error: "No se pudo iniciar el pago. Intenta de nuevo." },
      { status: 502 },
    );
  }

  // 4) Insertar payment (pending) + marcar invitación. El índice único parcial
  //    evita que dos requests concurrentes inserten dos filas pending.
  const { error: insertErr } = await admin
    .from("payments")
    .insert({
      invitation_id: inv.id,
      user_id: user.sub,
      provider: "mercadopago",
      mp_preference_id: prefId,
      init_point: initPoint,
      amount: price,
      currency: tpl.currency,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr) {
    // 23505: otro tab/request creó una preference pendiente entre el check
    // del paso 2 y este insert. Devolvemos SU init_point en vez de cobrar doble.
    if (insertErr.code === "23505") {
      const { data: winner } = await admin
        .from("payments")
        .select("init_point")
        .eq("invitation_id", inv.id)
        .eq("status", "pending")
        .maybeSingle();
      if (winner?.init_point) {
        return NextResponse.json({ url: winner.init_point, reused: true });
      }
    }
    console.error("[checkout] payment insert failed:", insertErr);
    return NextResponse.json(
      { error: "No se pudo registrar el pago. Intenta de nuevo." },
      { status: 500 },
    );
  }

  await admin
    .from("invitations")
    .update({ status: "pending_payment" })
    .eq("id", inv.id);

  return NextResponse.json({ url: initPoint });
}