-- 0004_auth0.sql — migrar identidad de Supabase Auth a Auth0.
-- user_id deja de ser uuid (auth.users) y pasa a ser text (el `sub` de Auth0).
-- El acceso a datos va por el servidor con service-role, así que RLS por
-- auth.uid() ya no aplica: se quitan esas políticas (RLS queda deny-all para
-- anon; service-role la bypassa).

-- 1) Quitar políticas que dependían de auth.uid().
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "invitations_read_owner_or_public_active" on public.invitations;
drop policy if exists "invitations_insert_own" on public.invitations;
drop policy if exists "invitations_update_own_unpaid" on public.invitations;
drop policy if exists "invitations_delete_own" on public.invitations;
drop policy if exists "payments_select_own" on public.payments;

-- 2) Quitar trigger/función/tabla profiles (dependían de auth.users de Supabase).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.profiles;

-- 3) invitations.user_id y payments.user_id: uuid → text (sub de Auth0).
alter table public.invitations drop constraint if exists invitations_user_id_fkey;
alter table public.payments   drop constraint if exists payments_user_id_fkey;
alter table public.invitations alter column user_id type text using user_id::text;
alter table public.payments   alter column user_id type text using user_id::text;

-- RLS sigue habilitado; el servidor usa service-role (bypassa RLS).
-- templates conserva su lectura pública de activos (templates_read_active).
