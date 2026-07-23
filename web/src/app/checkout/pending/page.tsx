import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

// Pantalla a la que MP redirige cuando el pago queda pendiente (ej. pago en
// efectivo, transferencia bancaria). El webhook eventualmente activará la
// invitación cuando MP confirme.
export default async function CheckoutPendingPage({
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
        <div className="text-5xl">⏳</div>
        <h1 className="mt-4 text-2xl font-bold">Pago pendiente de confirmación</h1>
        <p className="mt-2 text-ink/60">
          Tu pago quedó registrado pero Mercado Pago aún no lo confirma
          (puede tardar minutos u horas según el método de pago).
        </p>
        <p className="mt-2 text-sm text-ink/60">
          Te avisaremos cuando se confirme. Mientras tanto, puedes volver al
          dashboard; actualizaremos el estado automáticamente.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {invitationId && (
            <Link
              href={`/checkout/success?invitation_id=${invitationId}`}
              className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-deep"
            >
              Verificar ahora
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