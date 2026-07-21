-- 0003_blank_template.sql — plantilla "en blanco".
-- is_active=false → no aparece en el catálogo público de la landing, pero sí
-- se puede usar desde el selector /create (y guardar/pagar como cualquier otra).
insert into public.templates (key, name, description, category, base_price, active_days_after, is_active)
values ('blank', 'En blanco', 'Empieza desde cero.', 'blank', 14900, 7, false)
on conflict (key) do nothing;
