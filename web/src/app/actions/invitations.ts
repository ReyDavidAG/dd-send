"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomSlug } from "@/lib/slug";
import { getTemplate } from "@/templates/registry";
import { MAX_DRAFTS } from "@/lib/limits";
import type { InvitationContent } from "@/templates/types";

export type SaveDraftInput = {
  id?: string; // presente = actualizar borrador existente
  templateKey: string;
  content: InvitationContent;
};

export type SaveDraftResult = { id: string; slug: string };

// Crea o actualiza un borrador (status='draft') del usuario actual (sub de Auth0).
// Acceso con service-role; la propiedad se valida por user_id = sub.
export async function saveDraft(input: SaveDraftInput): Promise<SaveDraftResult> {
  const uid = await requireUserId();
  if (!getTemplate(input.templateKey)) throw new Error("Plantilla inválida");

  const admin = createAdminClient();
  const { data: tpl, error: tplErr } = await admin
    .from("templates")
    .select("id")
    .eq("key", input.templateKey)
    .single();
  if (tplErr || !tpl) throw new Error("Plantilla no encontrada");

  const eventDate = input.content.eventDate || null;

  // Actualizar borrador existente: solo el dueño y solo si no está activa.
  if (input.id) {
    const { data, error } = await admin
      .from("invitations")
      .update({ content: input.content, event_date: eventDate })
      .eq("id", input.id)
      .eq("user_id", uid)
      .neq("status", "active")
      .select("id, slug")
      .single();
    if (error) throw error;
    return data;
  }

  // Límite de borradores: no crear más de MAX_DRAFTS por usuario.
  const { count } = await admin
    .from("invitations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("status", "draft");
  if ((count ?? 0) >= MAX_DRAFTS)
    throw new Error(`Alcanzaste el límite de ${MAX_DRAFTS} borradores. Elimina uno para crear otro.`);

  // Crear: reintenta si el slug colisiona (violación de unicidad 23505).
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .from("invitations")
      .insert({
        user_id: uid,
        template_id: tpl.id,
        slug: randomSlug(),
        status: "draft",
        content: input.content,
        event_date: eventDate,
      })
      .select("id, slug")
      .single();
    if (!error) return data;
    if (error.code !== "23505") throw error;
  }
  throw new Error("No se pudo generar un slug único, intenta de nuevo.");
}

// Elimina un borrador (o invitación no activa) del usuario. Las activas (pagadas)
// no se pueden borrar.
export async function deleteInvitation(id: string): Promise<void> {
  const uid = await requireUserId();
  const admin = createAdminClient();
  const { error } = await admin
    .from("invitations")
    .delete()
    .eq("id", id)
    .eq("user_id", uid)
    .neq("status", "active");
  if (error) throw error;
  revalidatePath("/dashboard");
}
