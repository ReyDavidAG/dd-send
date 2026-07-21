"use client";

import { useActionState, useState } from "react";
import { updateProfile, type AppProfile, type ProfileState } from "@/app/actions/profile";
import { IconCheck } from "@/components/icons";

// Ladas comunes (default México +52).
const COUNTRY_CODES = [
  { code: "52", label: "🇲🇽 +52" },
  { code: "1", label: "🇺🇸 +1" },
  { code: "34", label: "🇪🇸 +34" },
  { code: "57", label: "🇨🇴 +57" },
  { code: "54", label: "🇦🇷 +54" },
  { code: "51", label: "🇵🇪 +51" },
  { code: "56", label: "🇨🇱 +56" },
];

// Separa "+524741285394" en { cc: "52", number: "4741285394" }.
function splitPhone(full: string): { cc: string; number: string } {
  const digits = (full || "").replace(/\D/g, "");
  if (digits.length >= 10) return { cc: digits.slice(0, -10) || "52", number: digits.slice(-10) };
  return { cc: "52", number: "" };
}

export function ProfileForm({ initial }: { initial: AppProfile }) {
  const start = splitPhone(initial.phone);
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfile, null);
  const [cc, setCc] = useState(start.cc);
  const [number, setNumber] = useState(start.number);

  const numberValid = number.length === 0 || number.length === 10;
  const inputCls = "w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-coral";

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line">
      <h2 className="font-semibold">Datos de tu cuenta</h2>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Nombre para mostrar</span>
        <input
          name="display_name"
          defaultValue={initial.display_name}
          maxLength={60}
          placeholder="Cómo quieres que te vean"
          className={inputCls}
        />
      </label>

      <div className="space-y-1">
        <span className="text-sm font-medium">Teléfono</span>
        <div className="flex gap-2">
          <select
            name="phone_cc"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            className="w-28 shrink-0 rounded-xl border border-line px-2 py-2 outline-none focus:border-coral"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            name="phone"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder="10 dígitos"
            aria-invalid={!numberValid}
            className={`${inputCls} ${!numberValid ? "border-coral-deep" : ""}`}
          />
        </div>
        {!numberValid && <p className="text-xs text-coral-deep">Ingresa 10 dígitos ({number.length}/10).</p>}
        {numberValid && number.length === 0 && <p className="text-xs text-ink/40">Opcional.</p>}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !numberValid}
          className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-coral-deep disabled:opacity-60"
        >
          {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {!pending && state?.ok && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
            <IconCheck className="h-4 w-4" /> Guardado
          </span>
        )}
        {!pending && state?.error && <span className="text-sm text-coral-deep">{state.error}</span>}
      </div>
    </form>
  );
}
