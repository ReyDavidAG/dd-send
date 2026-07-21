"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

// Crea o actualiza un borrador de invitación (status='draft') del usuario actual.
export async function saveDraft(input: SaveDraftInput): Promise<SaveDraftResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!getTemplate(input.templateKey)) throw new Error("Plantilla inválida");

  const { data: tpl, error: tplErr } = await supabase
    .from("templates")
    .select("id")
    .eq("key", input.templateKey)
    .single();
  if (tplErr || !tpl) throw new Error("Plantilla no encontrada");

  const eventDate = input.content.eventDate || null;

  // Actualizar borrador existente (RLS: solo el dueño y solo si no está activa).
  if (input.id) {
    const { data, error } = await supabase
      .from("invitations")
      .update({ content: input.content, event_date: eventDate })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select("id, slug")
      .single();
    if (error) throw error;
    return data;
  }

  // Límite de borradores: no crear más de MAX_DRAFTS por usuario.
  const { count } = await supabase
    .from("invitations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "draft");
  if ((count ?? 0) >= MAX_DRAFTS)
    throw new Error(`Alcanzaste el límite de ${MAX_DRAFTS} borradores. Elimina uno para crear otro.`);

  // Crear: reintenta si el slug colisiona (violación de unicidad 23505).
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("invitations")
      .insert({
        user_id: user.id,
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
// no se pueden borrar. RLS + filtros por dueño protegen la operación.
export async function deleteInvitation(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .neq("status", "active");
  if (error) throw error;
  revalidatePath("/dashboard");
}
