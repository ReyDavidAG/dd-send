-- 0001_init.sql — esquema inicial + RLS + triggers
-- Dinero en centavos (integer). "Expirada" se deriva (expires_at < now()), no se guarda.

-- ========================= profiles (1:1 con auth.users) =========================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now()
);

-- Crea el profile automáticamente al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========================= templates (catálogo) =========================
create table public.templates (
  id                uuid primary key default gen_random_uuid(),
  key               text unique not null,           -- 'cita' | 'cumpleanos' | 'boda'
  name              text not null,
  description       text,
  category          text not null,
  base_price        integer not null,               -- centavos MXN
  currency          text not null default 'MXN',
  active_days_after integer not null default 7,      -- margen para expires_at
  preview_image     text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- ========================= invitations =========================
create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  template_id  uuid not null references public.templates(id),
  slug         text unique not null,
  status       text not null default 'draft'
               check (status in ('draft','pending_payment','active')),
  content      jsonb not null default '{}'::jsonb,
  event_date   timestamptz,
  published_at timestamptz,
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index invitations_user_id_idx on public.invitations(user_id);

-- ========================= payments =========================
create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  invitation_id    uuid not null references public.invitations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  provider         text not null default 'mercadopago',
  mp_preference_id text,
  mp_payment_id    text,
  amount           integer not null,                -- centavos
  currency         text not null default 'MXN',
  status           text not null default 'pending'
                   check (status in ('pending','approved','rejected','refunded')),
  raw              jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index payments_invitation_id_idx on public.payments(invitation_id);
create index payments_mp_payment_id_idx on public.payments(mp_payment_id);

-- ========================= updated_at automático =========================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger invitations_touch before update on public.invitations
  for each row execute function public.touch_updated_at();
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

-- ========================= Row Level Security =========================
alter table public.profiles    enable row level security;
alter table public.templates   enable row level security;
alter table public.invitations enable row level security;
alter table public.payments    enable row level security;

-- profiles: cada quien el suyo
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- templates: catálogo público (solo lectura de activos). Escritura vía service-role.
create policy "templates_read_active" on public.templates
  for select using (is_active);

-- invitations:
--   lectura: el dueño, O cualquiera si está activa y no expiró (página pública /i/[slug])
--   inserción/edición: solo el dueño y solo mientras NO esté activa (evita auto-activarse
--   sin pagar). La activación (status='active') la hace el webhook con service-role.
create policy "invitations_read_owner_or_public_active" on public.invitations
  for select using (
    auth.uid() = user_id
    or (status = 'active' and expires_at is not null and expires_at > now())
  );
create policy "invitations_insert_own" on public.invitations
  for insert with check (auth.uid() = user_id and status in ('draft','pending_payment'));
create policy "invitations_update_own_unpaid" on public.invitations
  for update
  using (auth.uid() = user_id and status in ('draft','pending_payment'))
  with check (auth.uid() = user_id and status in ('draft','pending_payment'));
create policy "invitations_delete_own" on public.invitations
  for delete using (auth.uid() = user_id);

-- payments: el dueño solo lee. La escritura la hace el servidor con service-role.
create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);
