import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verificación de auth dentro del componente (no confiar solo en el proxy).
  if (!user) redirect("/login");

  return (
    <main className="flex-1">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-semibold">
          Invita
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-wine/70">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="font-semibold text-rose-deep">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold">Mis invitaciones</h1>
        {/* Fase 6: aquí irá la lista real de invitaciones con su estado. */}
        <p className="mt-4 text-wine/70">Aún no tienes invitaciones.</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-wine px-6 py-3 font-semibold text-cream transition hover:bg-rose-deep"
        >
          Crear una invitación
        </Link>
      </section>
    </main>
  );
}
