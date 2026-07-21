import { AuthForm } from "@/components/AuthForm";
import { signUp } from "@/app/auth/actions";

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <AuthForm
        action={signUp}
        title="Crea tu cuenta"
        submitLabel="Registrarme"
        altText="¿Ya tienes cuenta?"
        altHref="/login"
        altLabel="Inicia sesión"
      />
    </main>
  );
}
