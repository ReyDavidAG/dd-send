import { NextResponse } from "next/server";

// Endpoint temporal de diagnóstico. Devuelve (sin secretos completos) qué
// envs está leyendo el runtime de Vercel. Útil para confirmar que los
// tokens de MP están bien configurados.
//
// USO: GET https://dd-send.vercel.app/api/debug/env
// BORRAR cuando los pagos estén funcionando en producción.
export async function GET() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  return NextResponse.json({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    MERCADOPAGO_ACCESS_TOKEN: {
      present: !!token,
      prefix: token.slice(0, 12),
      looksLike: token.startsWith("TEST-")
        ? "test"
        : token.startsWith("APP_USR-")
        ? "prod"
        : "unknown",
      length: token.length,
    },
    MERCADOPAGO_WEBHOOK_SECRET: {
      present: !!secret,
      // Solo primeros 4 chars para que el usuario pueda comparar con el MP
      // dashboard sin exponer el secret entero. Si NO matchea, la env está
      // mal configurada.
      prefix: secret.slice(0, 4),
      length: secret.length,
    },
    PAYMENTS_ENABLED: process.env.PAYMENTS_ENABLED ?? null,
    vercel_env: process.env.VERCEL_ENV,
    vercel_deployment: process.env.VERCEL_DEPLOYMENT_ID?.slice(0, 8),
  });
}