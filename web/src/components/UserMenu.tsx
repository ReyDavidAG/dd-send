"use client";

import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { IconUser, IconLogout, IconLayout } from "@/components/icons";

// Menú de usuario con Radix DropdownMenu: cierre por click-fuera/Esc, foco
// gestionado y animación de entrada/salida (clases dd-content).
export function UserMenu({
  name,
  email,
  picture,
}: {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}) {
  const display = name || email || "Mi cuenta";
  const initial = (display[0] || "?").toUpperCase();

  return (
    <Dropdown.Root>
      <Dropdown.Trigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 outline-none transition hover:bg-sand data-[state=open]:bg-sand">
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={picture} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-line" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-coral text-sm font-bold text-white">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold sm:inline">{display}</span>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          className="dd-content z-50 w-56 origin-top-right overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-line"
        >
          <Dropdown.Label className="truncate px-3 py-2 text-xs text-ink/50">{email}</Dropdown.Label>
          <Dropdown.Item asChild>
            <Link
              href="/dashboard"
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium outline-none data-[highlighted]:bg-sand"
            >
              <IconLayout className="h-4 w-4 text-ink/60" /> Mis invitaciones
            </Link>
          </Dropdown.Item>
          <Dropdown.Item asChild>
            <Link
              href="/profile"
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium outline-none data-[highlighted]:bg-sand"
            >
              <IconUser className="h-4 w-4 text-ink/60" /> Mi perfil
            </Link>
          </Dropdown.Item>
          <Dropdown.Separator className="my-1 h-px bg-line" />
          <Dropdown.Item asChild>
            <a
              href="/auth/logout"
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium text-coral-deep outline-none data-[highlighted]:bg-lilac"
            >
              <IconLogout className="h-4 w-4" /> Cerrar sesión
            </a>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
