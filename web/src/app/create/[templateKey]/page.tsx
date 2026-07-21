import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
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
      />
    </main>
  );
}
