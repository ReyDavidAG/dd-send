import Link from "next/link";
import { requireUserId, getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_DRAFTS } from "@/lib/limits";
import { PayButton } from "@/components/PayButton";
import { DeleteDraftButton } from "@/components/DeleteDraftButton";
import { Navbar } from "@/components/Navbar";
import { MiniPreview } from "@/components/MiniPreview";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { DashboardSuccessBanner } from "@/components/DashboardSuccessBanner";
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; invitation_id?: string }>;
}) {
  const uid = await requireUserId();
  const user = await getSessionUser();
  const { paid, invitation_id: justPaidId } = await searchParams;

  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("id, slug, status, expires_at, content, templates(key, name)")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  const invitations = (data ?? []) as unknown as Row[];
  const draftCount = invitations.filter((i) => i.status === "draft").length;
  const atLimit = draftCount >= MAX_DRAFTS;

  // Si volvimos de un pago aprobado (?paid=1), buscamos esa invitación para
  // mostrar el banner. Si no la encontramos (raro pero posible), no mostramos
  // nada para no confundir.
  const justPaid = paid === "1" && justPaidId
    ? invitations.find((i) => i.id === justPaidId)
    : null;
  const justPaidIsActive = justPaid?.status === "active";

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
          <ul className="mt-8 space-y-4">
            {invitations.map((inv) => {
              const b = badge(inv.status, inv.expires_at);
              const isActive = b.label === "Activa";
              const isExpired = b.label === "Expirada";
              const isPendingPayment = inv.status === "pending_payment";
              const editable = inv.status !== "active";
              const title = inv.content?.title || inv.templates?.name || "Invitación";
              const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/i/${inv.slug}`;
              return (
                <li
                  key={inv.id}
                  className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line sm:flex-row sm:items-center"
                >
                  {inv.templates && (
                    <div className="w-full shrink-0 overflow-hidden rounded-xl ring-1 ring-line sm:w-44">
                      <MiniPreview
                        templateKey={inv.templates.key}
                        content={inv.content ?? undefined}
                        className="h-28"
                        scale={0.3}
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{title}</p>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${b.cls}`}>
                      {b.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {editable && inv.templates && (
                      <Link href={`/create/${inv.templates.key}?id=${inv.id}`} className={btnGhost}>
                        <IconEdit className="h-4 w-4" /> Editar
                      </Link>
                    )}
                    {isActive && (
                      <>
                        <Link href={`/i/${inv.slug}`} target="_blank" className={btnGhost}>
                          <IconEye className="h-4 w-4" /> Ver
                        </Link>
                        <CopyLinkButton
                          url={publicUrl}
                          label="📋 Copiar link"
                          className={btnGhost}
                        />
                      </>
                    )}
                    {isExpired && (
                      <span className="text-xs text-ink/50">
                        La fecha del evento ya pasó.
                      </span>
                    )}
                    {isPendingPayment && (
                      <Link
                        href={`/checkout/success?invitation_id=${inv.id}`}
                        className={`${btnBase} border border-amber bg-amber/15 text-ink hover:bg-amber/25`}
                      >
                        ⏳ Verificar pago
                      </Link>
                    )}
                    {!isActive && (
                      <PayButton
                        invitationId={inv.id}
                        className={`${btnBase} bg-coral text-white hover:bg-coral-deep disabled:opacity-60`}
                      >
                        <IconPay className="h-4 w-4" /> Pagar y publicar
                      </PayButton>
                    )}
                    {editable && (
                      <DeleteDraftButton
                        id={inv.id}
                        name={title}
                        className={`${btnBase} border border-line text-coral-deep hover:bg-lilac`}
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