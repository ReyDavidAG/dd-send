"use client";

import { useTransition } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { deleteInvitation } from "@/app/actions/invitations";
import { IconTrash } from "@/components/icons";

// Confirmación de borrado con Radix AlertDialog: overlay + foco atrapado, cierre
// por Esc/click-fuera/Cancelar, y animación (dd-overlay / dd-content).
export function DeleteDraftButton({ id, name, className }: { id: string; name?: string; className?: string }) {
  const [pending, start] = useTransition();
  const confirm = () => start(() => void deleteInvitation(id));

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className={className}>
        <IconTrash className="h-4 w-4" />
        Eliminar
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dd-overlay fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <AlertDialog.Content className="dd-content fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lilac text-coral-deep">
              <IconTrash className="h-5 w-5" />
            </span>
            <div>
              <AlertDialog.Title className="text-lg font-bold">¿Eliminar borrador?</AlertDialog.Title>
              <AlertDialog.Description className="mt-1 text-sm text-ink/60">
                {name ? `Se eliminará “${name}”. ` : ""}Esta acción no se puede deshacer.
              </AlertDialog.Description>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-sand">
              Cancelar
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={(e) => {
                e.preventDefault(); // dejamos que la transición corra antes de cerrar
                confirm();
              }}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full bg-coral-deep px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:opacity-60"
            >
              <IconTrash className="h-4 w-4" />
              {pending ? "Eliminando…" : "Sí, eliminar"}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
