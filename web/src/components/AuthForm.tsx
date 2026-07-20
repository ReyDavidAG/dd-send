"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithGoogle, type AuthState } from "@/app/auth/actions";

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

      <div className="flex items-center gap-3 text-xs text-wine/50">
        <span className="h-px flex-1 bg-blush" />o<span className="h-px flex-1 bg-blush" />
      </div>

      {/* OAuth Google: form propio para no anidar y disparar su Server Action. */}
      <button
        type="submit"
        formAction={signInWithGoogle}
        formNoValidate
        className="flex w-full items-center justify-center gap-2 rounded-full border border-blush bg-white py-3 font-semibold transition hover:bg-cream"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-2 3.2-4.9 3.2-7.8z" />
          <path fill="#34A853" d="M12 23c2.9 0 5.3-1 7.1-2.6l-3.6-2.7c-1 .7-2.3 1.1-3.5 1.1-2.7 0-5-1.8-5.8-4.3H2.5v2.7A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M6.2 14.5a6.6 6.6 0 0 1 0-4.2V7.6H2.5a11 11 0 0 0 0 9.9l3.7-3z" />
          <path fill="#EA4335" d="M12 5.4c1.5 0 2.9.5 4 1.5l3-3A11 11 0 0 0 2.5 7.6l3.7 2.7C7 7.2 9.3 5.4 12 5.4z" />
        </svg>
        Continuar con Google
      </button>
    </form>
  );
}
