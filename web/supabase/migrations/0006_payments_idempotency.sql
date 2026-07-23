-- 0006_payments_idempotency.sql
-- Endurece la tabla `payments` para que el webhook de Mercado Pago sea
-- idempotente y el checkout no pueda crear preferencias duplicadas para
-- la misma invitación. Hace falta correr este SQL en el SQL Editor de
-- Supabase (o con supabase db push) antes de activar pagos en producción.

-- 1) mp_payment_id único cuando está presente.
--    El webhook de MP llega con el mismo id si reintenta; con el índice único
--    podemos usar INSERT ... ON CONFLICT para deduplicar.
create unique index if not exists payments_mp_payment_id_unique
  on public.payments (mp_payment_id)
  where mp_payment_id is not null;

-- 2) Solo una preferencia pendiente por invitación.
--    Evita que un doble-click en "Pagar y publicar" cree dos preferences y
--    deje al usuario con dos cargos y dos filas en `payments`.
create unique index if not exists payments_one_pending_per_invitation
  on public.payments (invitation_id)
  where status = 'pending';

-- 3) Índice de apoyo para que el dashboard y el webhook busquen rápido por
--    invitación + estado (ya existía el simple; este es compuesto).
create index if not exists payments_invitation_status_idx
  on public.payments (invitation_id, status);

-- 4) init_point guardado para reusar la URL de Checkout Pro en reintentos
--    sin tener que volver a llamar a la API de MP. Lo creamos la primera vez
--    que se crea la preference y lo devolvemos si el usuario hace click dos
--    veces (o refresh) mientras el pago está pendiente.
alter table public.payments add column if not exists init_point text;