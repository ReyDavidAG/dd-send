import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mpPreference } from "@/lib/mercadopago";

// Crea la preferencia de Checkout Pro para una invitación y la marca
// pending_payment. Devuelve la URL de pago.
export async function POST(request: Request) {
  const { invitationId } = await request.json().catch(() => ({}));
  if (!invitationId) return NextResponse.json({ error: "Falta invitationId" }, { status: 400 });

  // 1) Verificar sesión.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // 2) Verificar propiedad + estado con service-role.
  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invitations")
    .select("id, user_id, status, template_id, content, templates(name, base_price, currency)")
    .eq("id", invitationId)
    .single();

  if (!inv || inv.user_id !== user.id)
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  if (inv.status === "active")
    return NextResponse.json({ error: "La invitación ya está activa" }, { status: 409 });

  const tpl = inv.templates as unknown as { name: string; base_price: number; currency: string };
  const site = process.env.NEXT_PUBLIC_SITE_URL!;

  // 3) Crear preferencia de Mercado Pago.
  const pref = await mpPreference().create({
    body: {
      items: [
        {
          id: inv.template_id,
          title: `Invitación · ${tpl.name}`,
          quantity: 1,
          unit_price: tpl.base_price / 100, // centavos → unidades
          currency_id: tpl.currency,
        },
      ],
      external_reference: inv.id,
      back_urls: {
        success: `${site}/dashboard?paid=1`,
        failure: `${site}/dashboard?paid=0`,
        pending: `${site}/dashboard?paid=pending`,
      },
      auto_return: "approved",
      notification_url: `${site}/api/webhooks/mercadopago`,
    },
  });

  // 4) Registrar pago (pending) y marcar la invitación.
  await admin.from("payments").insert({
    invitation_id: inv.id,
    user_id: user.id,
    provider: "mercadopago",
    mp_preference_id: pref.id,
    amount: tpl.base_price,
    currency: tpl.currency,
    status: "pending",
  });
  await admin.from("invitations").update({ status: "pending_payment" }).eq("id", inv.id);

  return NextResponse.json({ url: pref.init_point });
}
