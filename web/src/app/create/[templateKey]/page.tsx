import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_DRAFTS } from "@/lib/limits";
import { getTemplate } from "@/templates/registry";
import type { InvitationContent } from "@/templates/types";
import { CreateEditor } from "@/components/CreateEditor";

export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ templateKey: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { templateKey } = await params;
  const { id } = await searchParams;
  const def = getTemplate(templateKey);
  if (!def) notFound();

  const uid = await requireUserId();
  const admin = createAdminClient();
  const { data: tpl } = await admin
    .from("templates")
    .select("name")
    .eq("key", templateKey)
    .single();

  // Modo edición: cargar un borrador existente (no activo) del usuario.
  let initial = def.schema.defaults;
  let draftId: string | undefined;
  if (id) {
    const { data: inv } = await admin
      .from("invitations")
      .select("id, content, status")
      .eq("id", id)
      .eq("user_id", uid)
      .single();
    if (inv && inv.status !== "active") {
      initial = { ...def.schema.defaults, ...(inv.content as InvitationContent) };
      draftId = inv.id;
    }
  }

  // Si estamos CREANDO uno nuevo (sin id) y el usuario ya está al tope de
  // borradores, avisamos al editor para que muestre un banner persistente
  // — el server action `saveDraft` igual va a fallar si intenta guardar.
  let draftLimitWarning: { count: number; max: number } | null = null;
  if (!draftId) {
    const { count } = await admin
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("status", "draft");
    const draftCount = count ?? 0;
    if (draftCount >= MAX_DRAFTS) {
      draftLimitWarning = { count: draftCount, max: MAX_DRAFTS };
    }
  }

  return (
    <main className="flex-1">
      <CreateEditor
        templateKey={def.key}
        templateName={tpl?.name ?? def.key}
        fields={def.schema.fields}
        palettes={def.schema.palettes}
        style={def.style}
        initial={initial}
        initialId={draftId}
        draftLimitWarning={draftLimitWarning}
      />
    </main>
  );
}
