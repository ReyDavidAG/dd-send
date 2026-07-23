import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/Navbar";

// Pantalla a la que MP redirige cuando el pago falla o el usuario cancela.
// El borrador sigue intacto en el dashboard.
export default async function CheckoutFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ invitation_id?: string }>;
}) {
  const { invitation_id: invitationId } = await searchParams;
  const user = await getSessionUser();
  const uid = await requireUserId();

  // Ruta correcta al borrador: hay que usar la plantilla real, no una fija.
  let editHref: string | null = null;
  if (invitationId) {
    const admin = createAdminClient();
    const { data: inv } = await admin
      .from("invitations")
      .select("templates(key)")
      .eq("id", invitationId)
      .eq("user_id", uid)
      .maybeSingle();
    const key = (inv?.templates as unknown as { key?: string } | null)?.key;
    if (key) editHref = `/create/${key}?id=${invitationId}`;
  }

  return (
    <main className="flex-1">
      <Navbar user={user} />
      <section className="mx-auto max-w-xl px-5 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-coral/10 text-4xl">
          😕
        </div>
        <h1 className="mt-4 text-2xl font-bold">No se completó el pago</h1>
        <p className="mt-2 text-ink/60">
          No te preocupes: <strong>no se te cobró nada</strong>. Tu borrador sigue guardado y puedes
          intentarlo de nuevo cuando quieras.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {editHref && (
            <Link
              href={editHref}
              className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-deep"
            >
              Volver a mi borrador
            </Link>
          )}
          <Link
            href="/dashboard"
            className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:bg-sand"
          >
            Ir al dashboard
          </Link>
        </div>
        <p className="mt-8 text-xs text-ink/40">
          Si el problema persiste, revisa que tu método de pago tenga fondos o intenta con otro.
        </p>
      </section>
    </main>
  );
}
