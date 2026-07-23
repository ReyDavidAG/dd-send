import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";
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
  await requireUserId();

  return (
    <main className="flex-1">
      <Navbar user={user} />
      <section className="mx-auto max-w-xl px-5 py-16 text-center">
        <div className="text-5xl">😕</div>
        <h1 className="mt-4 text-2xl font-bold">No se completó el pago</h1>
        <p className="mt-2 text-ink/60">
          No te preocupes: no cobramos nada. Tu borrador sigue guardado y puedes
          intentarlo de nuevo cuando quieras.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {invitationId && (
            <Link
              href={`/create/cumpleanos?id=${invitationId}`}
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
      </section>
    </main>
  );
}