-- 0005_profiles.sql — perfil de app editable por el usuario, keyed por el
-- `sub` de Auth0. La identidad (email, foto, nombre) la da Auth0; aquí solo
-- guardamos datos que el usuario puede editar en la app.
create table if not exists public.profiles (
  sub          text primary key,          -- Auth0 sub (userId)
  display_name text,
  phone        text,
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;
-- Sin políticas para anon: solo el servidor (service-role) accede (bypassa RLS).
