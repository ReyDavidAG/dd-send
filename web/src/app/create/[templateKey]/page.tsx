import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: tpl },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("templates").select("name").eq("key", templateKey).single(),
  ]);
  if (!user) redirect("/login");

  // Modo edición: cargar un borrador existente (no activo) del usuario.
  let initial = def.schema.defaults;
  let draftId: string | undefined;
  if (id) {
    const { data: inv } = await supabase
      .from("invitations")
      .select("id, content, status")
      .eq("id", id)
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
        initial={initial}
        initialId={draftId}
        userId={user.id}
      />
    </main>
  );
}
