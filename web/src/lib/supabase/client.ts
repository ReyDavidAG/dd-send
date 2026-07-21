import { createBrowserClient } from '@supabase/ssr';

// Cliente para el navegador (usa la anon key; RLS aplica).
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
