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

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-3xl font-bold">Mis invitaciones</h1>
        {/* Fase 6: aquí irá la lista real de invitaciones con su estado. */}
        <p className="mt-4 text-ink/70">Aún no tienes invitaciones.</p>
        <Link
          href="/#plantillas"
          className="mt-8 inline-block rounded-full bg-coral px-6 py-3 font-semibold text-white transition hover:bg-coral-deep"
        >
          Crear una invitación
        </Link>
      </section>
    </main>
  );
}
