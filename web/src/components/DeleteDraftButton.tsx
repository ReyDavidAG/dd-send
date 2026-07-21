"use client";

import { useTransition } from "react";
import { deleteInvitation } from "@/app/actions/invitations";

// Elimina un borrador con confirmación. El server action revalida /dashboard.
export function DeleteDraftButton({ id, className }: { id: string; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Eliminar este borrador? Esta acción no se puede deshacer.")) {
          start(() => {
            void deleteInvitation(id);
          });
        }
      }}
      className={className}
    >
      {pending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
