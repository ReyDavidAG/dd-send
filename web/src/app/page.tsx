import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Landing, type TemplateCard } from "@/components/Landing";
import { Navbar } from "@/components/Navbar";

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
      <Navbar user={user} />

      <Landing templates={cards} hasUser={!!user} />

      <footer className="border-t border-line px-5 py-10 text-center text-sm text-ink/50">
        DD-Send · Hecho con 💕
      </footer>
    </main>
  );
}
