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

type Status = "active" | "pending_payment" | "draft" | "expired";

function classify(status: string, expiresAt: string | null): Status {
  if (status === "active" && expiresAt && new Date(expiresAt) < new Date()) return "expired";
  if (status === "active") return "active";
  if (status === "pending_payment") return "pending_payment";
  return "draft";
}

const badgeCls: Record<Status, { label: string; cls: string }> = {
  active: { label: "Activa", cls: "bg-green-100 text-green-700" },
  expired: { label: "Expirada", cls: "bg-ink/10 text-ink/60" },
  pending_payment: { label: "Pago pendiente", cls: "bg-amber/25 text-ink" },
  draft: { label: "Borrador", cls: "bg-lilac text-coral-deep" },
};

// Padding `px-3 py-2 text-xs` en móvil, `sm:px-4 sm:text-sm` en desktop.
// Los botones quepan 3-4 por fila sin desbordar.
const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm whitespace-nowrap";

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

  // Reglas para "+Nueva":
  //  - límite de borradores (MAX_DRAFTS)
  //  - solo 1 pago en proceso a la vez (no se puede crear otro hasta que se
  //    pague o se elimine el pendiente). Evita preferencias huérfanas y
  //    confusión del usuario.
  const draftCount = invitations.filter((i) => i.status === "draft").length;
  const hasPendingPayment = invitations.some((i) => i.status === "pending_payment");
  const canCreateNew = draftCount < MAX_DRAFTS && !hasPendingPayment;

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
          {canCreateNew ? (
            <Link href="/create" className={`${btn} bg-coral text-white hover:bg-coral-deep`}>
              <IconPlus className="h-4 w-4" /> Nueva
            </Link>
          ) : (
            <span
              className={`${btn} cursor-not-allowed bg-ink/10 text-ink/50`}
              title={
                hasPendingPayment
                  ? "Tienes un pago en proceso. Complétalo o elimínalo para crear otro."
                  : `Máximo ${MAX_DRAFTS} borradores. Elimina uno para crear otro.`
              }
            >
              <IconPlus className="h-4 w-4" /> Nueva
            </span>
          )}
        </div>
        {!canCreateNew && (
          <p className="mt-3 text-sm text-ink/60">
            {hasPendingPayment
              ? "Tienes un pago en proceso. Complétalo o elimínalo para crear otro."
              : `Llegaste al máximo de ${MAX_DRAFTS} borradores. Elimina uno para crear otro.`}
          </p>
        )}

        {justPaid && justPaidIsActive && (
          <div className="mt-6">
            <DashboardSuccessBanner
              invitationId={justPaid.id}
              invitationSlug={justPaid.slug}
              title={justPaid.content?.title || justPaid.templates?.name || "Invitación"}
            />
          </div>
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
              const status = classify(inv.status, inv.expires_at);
              const b = badgeCls[status];
              const title = inv.content?.title || inv.templates?.name || "Invitación";
              const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/i/${inv.slug}`;

              return (
                <li
                  key={inv.id}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line"
                >
                  {/* Header: imagen + título + badge */}
                  <div className="flex items-center gap-4">
                    {inv.templates && (
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-line sm:h-24 sm:w-28">
                        <MiniPreview
                          templateKey={inv.templates.key}
                          content={inv.content ?? undefined}
                          className="h-full"
                          scale={0.25}
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{title}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${b.cls}`}
                      >
                        {b.label}
                      </span>
                    </div>
                  </div>

                  {/* Acciones: SIEMPRE en su propia fila, wrap limpio */}
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                    <ActionsRow inv={inv} status={status} publicUrl={publicUrl} />
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

function ActionsRow({
  inv,
  status,
  publicUrl,
}: {
  inv: Row;
  status: Status;
  publicUrl: string;
}) {
  const editable = status === "draft";
  const pending = status === "pending_payment";
  const title = inv.content?.title || inv.templates?.name;

  return (
    <>
      {editable && inv.templates && (
        <Link href={`/create/${inv.templates.key}?id=${inv.id}`} className={`${btn} border border-line hover:bg-sand`}>
          <IconEdit className="h-4 w-4" /> Editar
        </Link>
      )}
      {status === "active" && (
        <>
          <Link href={`/i/${inv.slug}`} target="_blank" className={`${btn} border border-line hover:bg-sand`}>
            <IconEye className="h-4 w-4" /> Ver
          </Link>
          <CopyLinkButton
            url={publicUrl}
            label="📋 Copiar link"
            className={`${btn} border border-line hover:bg-sand`}
          />
        </>
      )}
      {status === "expired" && (
        <span className="text-xs text-ink/50">La fecha del evento ya pasó.</span>
      )}
      {/* pending_payment: solo acción para retomar el pago (reusa init_point).
          Si quieren cancelar, eliminan el draft. No hay "verificar" manual:
          cuando MP confirma, el webhook activa y el badge cambia a Activa. */}
      {pending && (
        <PayButton
          invitationId={inv.id}
          className={`${btn} bg-coral text-white hover:bg-coral-deep disabled:opacity-60`}
        >
          <IconPay className="h-4 w-4" /> Completar pago
        </PayButton>
      )}
      {(editable || pending) && (
        <DeleteDraftButton
          id={inv.id}
          name={title}
          className={`${btn} border border-line text-coral-deep hover:bg-lilac`}
        />
      )}
    </>
  );
}