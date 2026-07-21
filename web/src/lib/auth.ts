import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";

// Usuario de la sesión de Auth0 (o null). `sub` es el userId que asociamos a
// los registros de Supabase (columna user_id).
export async function getSessionUser() {
  const session = await auth0.getSession();
  return session?.user ?? null;
}

// Exige sesión: devuelve el `sub` (userId de Auth0) o redirige al login de Auth0.
export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user?.sub) redirect("/auth/login");
  return user.sub;
}
