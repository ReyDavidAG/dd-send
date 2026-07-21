import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

// Next 16: middleware → proxy (runtime nodejs, export nombrado `proxy`).
// Delega en el middleware de Auth0: gestiona la sesión y monta /auth/*.
export async function proxy(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  // Corre en todo menos estáticos e imágenes (necesita /auth/* y cookies de sesión).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
