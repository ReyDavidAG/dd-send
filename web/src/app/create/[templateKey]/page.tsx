import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/templates/registry";
import { CreateEditor } from "@/components/CreateEditor";

export default async function CreatePage({
  params,
}: {
  params: Promise<{ templateKey: string }>;
}) {
  const { templateKey } = await params;
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

  return (
    <main className="flex-1">
      <CreateEditor
        templateKey={def.key}
        templateName={tpl?.name ?? def.key}
        fields={def.schema.fields}
        palettes={def.schema.palettes}
        initial={def.schema.defaults}
        userId={user.id}
      />
    </main>
  );
}
