"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/app/auth/actions";

type Props = {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  title: string;
  submitLabel: string;
  altText: string;
  altHref: string;
  altLabel: string;
};

export function AuthForm({ action, title, submitLabel, altText, altHref, altLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-lg"
    >
      <h1 className="text-center text-2xl font-semibold">{title}</h1>

      <label className="block space-y-1">
        <span className="text-sm">Correo</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-blush px-3 py-2 outline-none focus:border-rose"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm">Contraseña</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          className="w-full rounded-lg border border-blush px-3 py-2 outline-none focus:border-rose"
        />
      </label>

      {state?.error && <p className="text-sm text-rose-deep">{state.error}</p>}
      {state?.message && <p className="text-sm text-wine">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-wine py-3 font-semibold text-cream transition hover:bg-rose-deep disabled:opacity-60"
      >
        {pending ? "Un momento…" : submitLabel}
      </button>

      <p className="text-center text-sm">
        {altText}{" "}
        <Link href={altHref} className="font-semibold text-rose-deep underline">
          {altLabel}
        </Link>
      </p>
    </form>
  );
}
