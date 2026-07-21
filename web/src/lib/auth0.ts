import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Cliente Auth0 (v4). Lee AUTH0_DOMAIN / AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET /
// AUTH0_SECRET / APP_BASE_URL del entorno. Monta /auth/login, /auth/logout,
// /auth/callback y /auth/profile vía el middleware (src/proxy.ts).
export const auth0 = new Auth0Client();
