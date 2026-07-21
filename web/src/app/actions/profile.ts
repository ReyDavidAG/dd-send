"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppProfile = { display_name: string; phone: string };
export type ProfileState = { ok?: boolean; error?: string } | null;

// Datos de app del usuario (editables). La identidad viene de Auth0.
// `phone` se guarda en formato +<lada><10 dígitos> (ej. +524741285394).
export async function getProfile(): Promise<AppProfile> {
  const uid = await requireUserId();
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("display_name, phone")
    .eq("sub", uid)
    .maybeSingle();
  return { display_name: data?.display_name ?? "", phone: data?.phone ?? "" };
}

// useActionState: (prevState, formData) => newState. Valida servidor-side.
export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const uid = await requireUserId();

  const display_name = String(formData.get("display_name") ?? "").trim();
  const cc = String(formData.get("phone_cc") ?? "52").replace(/\D/g, "");
  const number = String(formData.get("phone") ?? "").replace(/\D/g, "");

  if (display_name.length > 60) return { error: "El nombre para mostrar no puede pasar de 60 caracteres." };
  if (number && number.length !== 10) return { error: "El teléfono debe tener exactamente 10 dígitos." };
  if (number && !cc) return { error: "Selecciona la lada del país." };

  const phone = number ? `+${cc}${number}` : null;

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").upsert({
    sub: uid,
    display_name: display_name || null,
    phone,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };

  revalidatePath("/profile");
  return { ok: true };
}
