import Link from "next/link";
import { requireUserId, getSessionUser } from "@/lib/auth";
import { getProfile } from "@/app/actions/profile";
import { Navbar } from "@/components/Navbar";
import { ProfileForm } from "@/components/ProfileForm";
import { IconUser, IconArrowLeft } from "@/components/icons";

// Perfil del usuario: identidad de Auth0 (solo lectura) + datos de app editables
// (guardados en Supabase por el `sub`).
export default async function ProfilePage() {
  await requireUserId();
  const [user, profile] = await Promise.all([getSessionUser(), getProfile()]);

  return (
    <main className="flex-1">
      <Navbar user={user} />

      <section className="mx-auto max-w-2xl px-5 py-12">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
          <IconArrowLeft className="h-4 w-4" /> Mis invitaciones
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <IconUser className="h-7 w-7 text-coral-deep" /> Mi perfil
        </h1>

        {/* Identidad (Auth0, solo lectura) */}
        <div className="mt-8 flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line">
          {user?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.picture} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-line" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-coral text-2xl font-bold text-white">
              {(user?.name || user?.email || "?")[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{user?.name || "Sin nombre"}</p>
            <p className="truncate text-sm text-ink/60">{user?.email}</p>
            <p className="mt-1 text-xs text-ink/40">La foto y el correo se gestionan en tu cuenta de Auth0.</p>
          </div>
        </div>

        {/* Datos de app (editables) */}
        <ProfileForm initial={profile} />
      </section>
    </main>
  );
}
