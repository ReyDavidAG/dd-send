"use server";

import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_LIBRARY } from "@/lib/limits";

const BUCKET = "invitation-photos";

const folderOf = (uid: string) => uid.replace(/[^\w-]/g, "_"); // el sub trae '|' (auth0|123)
const publicUrl = (admin: ReturnType<typeof createAdminClient>, path: string) =>
  admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

// Galería del usuario = archivos bajo su carpeta en Storage (los "registros").
// No hay tabla: Storage ES el registro. Recientes primero.
export async function listPhotos(): Promise<string[]> {
  const uid = await requireUserId();
  const folder = folderOf(uid);
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .list(folder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
  if (error || !data) return [];
  return data.filter((o) => o.id).map((o) => publicUrl(admin, `${folder}/${o.name}`));
}

// Sube una foto a la galería (service-role + sesión Auth0), respetando el límite.
export async function uploadPhoto(formData: FormData): Promise<{ url: string }> {
  const uid = await requireUserId();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Archivo inválido");

  const folder = folderOf(uid);
  const admin = createAdminClient();
  const { data: existing } = await admin.storage.from(BUCKET).list(folder, { limit: 100 });
  if ((existing?.filter((o) => o.id).length ?? 0) >= MAX_LIBRARY)
    throw new Error(`Máximo ${MAX_LIBRARY} fotos en tu galería. Elimina una para subir otra.`);

  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(error.message);

  return { url: publicUrl(admin, path) };
}

// Borra el archivo real de Storage Y, por congruencia, quita esa URL de
// content.photos de TODAS las invitaciones del usuario, para no dejar
// referencias a un archivo que ya no existe.
export async function deletePhoto(url: string): Promise<void> {
  const uid = await requireUserId();
  const folder = folderOf(uid);
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  const path = decodeURIComponent(url.slice(i + marker.length));
  if (!path.startsWith(`${folder}/`)) return; // solo sus propias fotos

  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([path]);

  const { data } = await admin.from("invitations").select("id, content").eq("user_id", uid);
  for (const row of data ?? []) {
    const content = row.content as { photos?: string[] } | null;
    if (!content?.photos?.includes(url)) continue;
    await admin
      .from("invitations")
      .update({ content: { ...content, photos: content.photos.filter((u) => u !== url) } })
      .eq("id", row.id);
  }
}
