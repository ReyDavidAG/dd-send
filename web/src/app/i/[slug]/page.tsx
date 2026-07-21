import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTemplate, resolvePalette } from "@/templates/registry";
import type { InvitationContent } from "@/templates/types";

function Notice({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="text-5xl">{emoji}</div>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-ink/60">{subtitle}</p>
    </main>
  );
}

export default async function PublicInvitation({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Lectura server-side con service-role + validación explícita de estado/expiración.
  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invitations")
    .select("status, expires_at, content, templates(key)")
    .eq("slug", slug)
    .single();

  if (!inv) notFound();

  if (inv.status !== "active")
    return <Notice emoji="🔒" title="Invitación no disponible" subtitle="Esta invitación aún no ha sido publicada." />;

  if (inv.expires_at && new Date(inv.expires_at) < new Date())
    return <Notice emoji="⌛" title="Invitación expirada" subtitle="Esta invitación ya no está disponible." />;

  const key = (inv.templates as unknown as { key: string } | null)?.key ?? "";
  const def = getTemplate(key);
  if (!def) notFound();

  const content = inv.content as InvitationContent;
  const palette = resolvePalette(def, content.paletteKey);
  const { Component } = def;
  return <Component content={content} palette={palette} style={def.style} />;
}
