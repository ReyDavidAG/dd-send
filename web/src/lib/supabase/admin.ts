import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Cliente con service-role: SALTA RLS. Solo en el servidor (webhook de pago,
// activación de invitaciones). Nunca importar desde código de cliente.
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
