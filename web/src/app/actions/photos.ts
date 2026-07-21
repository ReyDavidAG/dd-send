"use server";

import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Sube una foto a Supabase Storage desde el servidor (service-role), validando
// la sesión de Auth0. El navegador ya no habla directo con Supabase.
export async function uploadPhoto(formData: FormData): Promise<{ url: string }> {
  const uid = await requireUserId();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Archivo inválido");

  const safeUid = uid.replace(/[^\w-]/g, "_"); // el sub trae '|' (auth0|123)
  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const path = `${safeUid}/${crypto.randomUUID()}-${safeName}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("invitation-photos")
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(error.message);

  return { url: admin.storage.from("invitation-photos").getPublicUrl(path).data.publicUrl };
}
