-- seed.sql — plantillas iniciales del catálogo.
-- Precios en centavos MXN. Ajusta a gusto.
insert into public.templates (key, name, description, category, base_price, active_days_after, preview_image)
values
  ('cita',       'Cita romántica', 'Invitación para una cita o noche de película.', 'cita',       14900,  7, '/templates/cita.jpg'),
  ('cumpleanos', 'Cumpleaños',     'Invitación festiva de cumpleaños.',            'cumpleanos', 14900,  3, '/templates/cumpleanos.jpg'),
  ('boda',       'Boda',           'Invitación elegante de boda.',                 'boda',       29900, 30, '/templates/boda.jpg')
on conflict (key) do nothing;
