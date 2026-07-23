"use server";

import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { mpPayment } from "@/lib/mercadopago";

// Resultado de verificar el estado del pago de una invitación.
// Lo usa la pantalla /checkout/success para polling/red de seguridad cuando
// el webhook de MP tarda más que el redirect del usuario.
export type CheckPaymentStatusResult =
  | { state: "active"; slug: string; expiresAt: string | null }
  | { state: "pending"; reason: "no_payment" | "not_approved_yet" | "no_payment_id" }
  | { state: "rejected" }
  | { state: "not_found" }
  | { state: "forbidden" };

// Devuelve el estado real de la invitación tras consultar la BD y, si está
// aprobada pero el webhook no llegó, consulta MP directamente y activa.
//
// NO se llama en bucle cerrado: el cliente debe respetarlo (polling con
// backoff). La activación manual es idempotente (chequea status != 'active'
// antes de escribir, igual que el webhook).
export async function checkPaymentStatus(
  invitationId: string,
): Promise<CheckPaymentStatusResult> {
  const user = await getSessionUser();
  if (!user?.sub) return { state: "forbidden" };

  const admin = createAdminClient();

  // 1) Leer invitación + su payment más reciente.
  const { data: inv } = await admin
    .from("invitations")
    .select("id, user_id, status, slug, expires_at")
    .eq("id", invitationId)
    .single();

  if (!inv) return { state: "not_found" };
  if (inv.user_id !== user.sub) return { state: "forbidden" };

  if (inv.status === "active") {
    return { state: "active", slug: inv.slug, expiresAt: inv.expires_at };
  }

  const { data: pay } = await admin
    .from("payments")
    .select("id, mp_payment_id, status")
    .eq("invitation_id", invitationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pay) return { state: "pending", reason: "no_payment" };
  if (pay.status === "rejected") return { state: "rejected" };
  if (pay.status !== "approved") {
    // Sigue pending. Si tenemos mp_payment_id, preguntamos a MP por el estado
    // real (el webhook pudo haber llegado ya o no). Si MP dice approved,
    // activamos manualmente. Si MP no ha procesado aún, devolvemos pending.
    if (!pay.mp_payment_id) return { state: "pending", reason: "no_payment_id" };

    try {
      const remote = await mpPayment().get({ id: pay.mp_payment_id });
      if (remote.status === "approved") {
        // Activar igual que el webhook.
        const { data: fresh } = await admin
          .from("invitations")
          .select("event_date, templates(active_days_after)")
          .eq("id", invitationId)
          .single();
        const days =
          (fresh?.templates as unknown as { active_days_after?: number } | null)
            ?.active_days_after ?? 7;
        const base = fresh?.event_date ? new Date(fresh.event_date).getTime() : Date.now();
        const expiresAt = new Date(base + days * 86_400_000).toISOString();

        await admin
          .from("payments")
          .update({ status: "approved", raw: remote as object })
          .eq("id", pay.id);
        await admin
          .from("invitations")
          .update({
            status: "active",
            published_at: new Date().toISOString(),
            expires_at: expiresAt,
          })
          .eq("id", invitationId)
          .neq("status", "active");

        // Releer para devolver el slug actualizado.
        const { data: after } = await admin
          .from("invitations")
          .select("slug, expires_at")
          .eq("id", invitationId)
          .single();
        return {
          state: "active",
          slug: after?.slug ?? inv.slug,
          expiresAt: after?.expires_at ?? expiresAt,
        };
      }
      if (remote.status === "rejected") {
        await admin
          .from("payments")
          .update({ status: "rejected", raw: remote as object })
          .eq("id", pay.id);
        return { state: "rejected" };
      }
    } catch (e) {
      // Si MP no responde, no rompemos: el usuario verá "pendiente" y puede
      // seguir reintentando. El webhook puede llegar después.
      console.error("[checkPaymentStatus] MP lookup failed:", e);
    }
    return { state: "pending", reason: "not_approved_yet" };
  }

  // pay.status === "approved" pero inv.status !== "active": inconsistencia.
  // El webhook debe llegar pronto; mientras tanto, devolvemos pending.
  return { state: "pending", reason: "not_approved_yet" };
}