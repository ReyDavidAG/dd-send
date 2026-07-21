import Link from "next/link";
import { requireUserId, getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_DRAFTS } from "@/lib/limits";
import { PayButton } from "@/components/PayButton";
import { DeleteDraftButton } from "@/components/DeleteDraftButton";
import { Navbar } from "@/components/Navbar";
import { MiniPreview } from "@/components/MiniPreview";
import { IconEdit, IconEye, IconPay, IconPlus } from "@/components/icons";
import type { InvitationContent } from "@/templates/types";

type Row = {
  id: string;
  slug: string;
  status: string;
  expires_at: string | null;
  content: InvitationContent | null;
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

const btnBase = "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition";
const btnGhost = `${btnBase} border border-line hover:bg-sand`;

export default async function DashboardPage() {
  const uid = await requireUserId();
  const user = await getSessionUser();

  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("id, slug, status, expires_at, content, templates(key, name)")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  const invitations = (data ?? []) as unknown as Row[];
  const draftCount = invitations.filter((i) => i.status === "draft").length;
  const atLimit = draftCount >= MAX_DRAFTS;

  return (
    <main className="flex-1">
      <Navbar user={user} />

      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">Mis invitaciones</h1>
          {atLimit ? (
            <span
              className={`${btnBase} cursor-not-allowed bg-ink/10 text-ink/50`}
              title={`Máximo ${MAX_DRAFTS} borradores. Elimina uno para crear otro.`}
            >
              <IconPlus className="h-4 w-4" /> Nueva
            </span>
          ) : (
            <Link href="/create" className={`${btnBase} bg-coral text-white hover:bg-coral-deep`}>
              <IconPlus className="h-4 w-4" /> Nueva
            </Link>
          )}
        </div>
        {atLimit && (
          <p className="mt-3 text-sm text-ink/60">
            Llegaste al máximo de {MAX_DRAFTS} borradores. Elimina uno para crear otro.
          </p>
        )}

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
                    {editable && (
                      <DeleteDraftButton
                        id={inv.id}
                        className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-coral-deep transition hover:bg-lilac disabled:opacity-60"
                      />
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
