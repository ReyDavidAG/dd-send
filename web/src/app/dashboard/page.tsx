import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { PayButton } from "@/components/PayButton";

type Row = {
  id: string;
  slug: string;
  status: string;
  expires_at: string | null;
  content: { title?: string } | null;
  templates: { key: string; name: string } | null;
};

function badge(status: string, expiresAt: string | null) {
  if (status === "active") {
    if (expiresAt && new Date(expiresAt) < new Date())
      return { label: "Expirada", cls: "bg-ink/10 text-ink/60" };
    return { label: "Activa", cls: "bg-green-100 text-green-700" };
  }
  if (status === "pending_payment") return { label: "Pago pendiente", cls: "bg-amber/25 text-ink" };
  return { label: "Borrador", cls: "bg-lilac text-coral-deep" };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("invitations")
    .select("id, slug, status, expires_at, content, templates(key, name)")
    .order("created_at", { ascending: false });
  const invitations = (data ?? []) as unknown as Row[];

  return (
    <main className="flex-1">
      <header className="flex items-center justify-between border-b border-line bg-white px-5 py-4 sm:px-8">
        <Link href="/" className="dd-text-gradient text-xl font-extrabold">
          DD-Send
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-ink/60 sm:inline">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="font-semibold text-coral-deep">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">Mis invitaciones</h1>
          <Link
            href="/create"
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-coral-deep"
          >
            + Nueva
          </Link>
        </div>

        {invitations.length === 0 ? (
          <p className="mt-16 text-center text-ink/60">
            Aún no tienes invitaciones.{" "}
            <Link href="/create" className="font-semibold text-coral-deep underline">
              Crea la primera
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {invitations.map((inv) => {
              const b = badge(inv.status, inv.expires_at);
              const isActive = b.label === "Activa";
              const editable = inv.status !== "active";
              return (
                <li
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{inv.content?.title || inv.templates?.name}</p>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${b.cls}`}>
                      {b.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {editable && inv.templates && (
                      <Link
                        href={`/create/${inv.templates.key}?id=${inv.id}`}
                        className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-sand"
                      >
                        Editar
                      </Link>
                    )}
                    {isActive && (
                      <Link
                        href={`/i/${inv.slug}`}
                        className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-sand"
                      >
                        Ver
                      </Link>
                    )}
                    {inv.status !== "active" && (
                      <PayButton
                        invitationId={inv.id}
                        className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral-deep disabled:opacity-60"
                      >
                        Pagar y publicar
                      </PayButton>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
