"use client";

import { useState } from "react";
import { COUNTRY_CODES, splitPhone } from "@/lib/phone";

// Campo de teléfono: select de lada (default +52) + 10 dígitos. Emite la cadena
// combinada solo-dígitos ("524741285394", sin +), lista para wa.me. Vacío si no
// hay número (para que la sección RSVP no aparezca).
export function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const start = splitPhone(value);
  const [cc, setCc] = useState(start.cc);
  const [number, setNumber] = useState(start.number);

  const emit = (nextCc: string, nextNumber: string) =>
    onChange(nextNumber ? `${nextCc}${nextNumber}` : "");

  const valid = number.length === 0 || number.length === 10;
  const inputCls = "w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-coral";

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <select
          value={cc}
          onChange={(e) => {
            setCc(e.target.value);
            emit(e.target.value, number);
          }}
          className="w-28 shrink-0 rounded-xl border border-line px-2 py-2 outline-none focus:border-coral"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          value={number}
          onChange={(e) => {
            const n = e.target.value.replace(/\D/g, "").slice(0, 10);
            setNumber(n);
            emit(cc, n);
          }}
          inputMode="numeric"
          placeholder="10 dígitos (ej. 4741285394)"
          aria-invalid={!valid}
          className={`${inputCls} ${!valid ? "border-coral-deep" : ""}`}
        />
      </div>
      {!valid && <p className="text-xs text-coral-deep">Ingresa 10 dígitos ({number.length}/10).</p>}
    </div>
  );
}
