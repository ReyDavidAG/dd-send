import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";

export type NavUser = { name?: string | null; email?: string | null; picture?: string | null } | null;

// Barra de navegación compartida (inicio, dashboard, perfil…). Con sesión
// muestra el menú de usuario; sin sesión, entrar / crear cuenta.
export function Navbar({ user }: { user: NavUser }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-sand/80 px-5 py-3 backdrop-blur sm:px-8">
      <Link href="/" className="dd-text-gradient text-xl font-extrabold">
        DD-Send
      </Link>
      {user ? (
        <UserMenu name={user.name} email={user.email} picture={user.picture} />
      ) : (
        <nav className="flex items-center gap-2 text-sm">
          <a href="/auth/login" className="rounded-full px-4 py-2 font-semibold text-ink/70 transition hover:text-ink">
            Entrar
          </a>
          <a
            href="/auth/login?screen_hint=signup"
            className="rounded-full bg-ink px-4 py-2 font-semibold text-sand transition hover:bg-ink/90"
          >
            Crear cuenta
          </a>
        </nav>
      )}
    </header>
  );
}
