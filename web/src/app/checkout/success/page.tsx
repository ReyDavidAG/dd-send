import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/Navbar";
import { CheckoutSuccessClient } from "@/components/CheckoutSuccessClient";
import { getSessionUser } from "@/lib/auth";

// Pantalla a la que MP redirige tras un pago aprobado (auto_return=approved).
// Aquí confirmamos contra el backend y, cuando se activa, mostramos el link
// público con botones de copiar / compartir.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ invitation_id?: string }>;
}) {
  const { invitation_id: invitationId } = await searchParams;
  const user = await getSessionUser();

  if (!invitationId) {
    return (
      <main className="flex-1">
        <Navbar user={user} />
        <section className="mx-auto max-w-xl px-5 py-16 text-center">
          <div className="text-5xl">🤔</div>
          <h1 className="mt-4 text-2xl font-bold">Falta el ID de la invitación</h1>
          <p className="mt-2 text-ink/60">Vuelve al dashboard para ver tus invitaciones.</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white"
          >
            Ir al dashboard
          </Link>
        </section>
      </main>
    );
  }

  await requireUserId(); // 401 → /auth/login si no hay sesión

  // Traemos datos para el mensaje de WhatsApp y el título de la ShareCard.
  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invitations")
    .select("content, templates(name)")
    .eq("id", invitationId)
    .maybeSingle();

  const content = (inv?.content ?? {}) as {
    title?: string;
    headline?: string;
    signature?: string;
  };
  const tpl = inv?.templates as unknown as { name?: string } | { name?: string }[] | null;
  const tplName = Array.isArray(tpl) ? tpl[0]?.name : tpl?.name;
  const title = content.title || content.headline || tplName || "Mi invitación";
  const signature = content.signature || "Con cariño";
  const message = `${title} — ${signature}`;

  return (
    <main className="flex-1">
      <Navbar user={user} />
      <section className="mx-auto max-w-xl px-5 py-12">
        <CheckoutSuccessClient
          invitationId={invitationId}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL!}
          title={title}
          message={message}
        />
      </section>
    </main>
  );
}