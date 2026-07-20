-- 0002_storage.sql — bucket de fotos + políticas.
-- Las fotos se muestran en invitaciones públicas → bucket público (lectura).
-- Escritura/borrado restringidos a la carpeta del propio usuario: {uid}/...

insert into storage.buckets (id, name, public)
values ('invitation-photos', 'invitation-photos', true)
on conflict (id) do nothing;

-- Subir: solo autenticados y solo dentro de su carpeta (primer segmento = uid).
create policy "invite_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'invitation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Borrar: igual, solo lo propio.
create policy "invite_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'invitation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lectura pública (el bucket es público; esto habilita el listado vía API).
create policy "invite_photos_read" on storage.objects
  for select
  using (bucket_id = 'invitation-photos');
