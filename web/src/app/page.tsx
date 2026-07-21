import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Landing, type TemplateCard } from "@/components/Landing";

// Home (server component): solo trae datos y monta el header. El resto (hero,
// pasos, plantillas, reveal de preview) lo renderiza <Landing> con animaciones
// scroll-driven vía Motion.
export default async function Home() {
  const admin = createAdminClient();
  const [user, { data: templates }] = await Promise.all([
    getSessionUser(),
    admin
      .from("templates")
      .select("key,name,description,category,base_price")
      .eq("is_active", true)
      .order("base_price"),
  ]);

  const cards: TemplateCard[] = (templates ?? []) as TemplateCard[];

  return (
    <main className="flex-1">
      {/* Header (claro) */}
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <span className="dd-text-gradient text-2xl font-extrabold">DD-Send</span>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <Link href="/dashboard" className="font-semibold text-coral-deep">
              Mis invitaciones
            </Link>
          ) : (
            <>
              <a href="/auth/login" className="font-semibold text-ink/70 hover:text-ink">
                Entrar
              </a>
              <a
                href="/auth/login?screen_hint=signup"
                className="rounded-full bg-ink px-4 py-2 font-semibold text-sand transition hover:bg-ink/90"
              >
                Crear cuenta
              </a>
            </>
          )}
        </nav>
      </header>

      <Landing templates={cards} hasUser={!!user} />

      <footer className="border-t border-line px-5 py-10 text-center text-sm text-ink/50">
        DD-Send · Hecho con 💕
      </footer>
    </main>
  );
}
