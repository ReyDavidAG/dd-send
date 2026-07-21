import { AuthForm } from "@/components/AuthForm";
import { signIn } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <AuthForm
        action={signIn}
        title="Inicia sesión"
        submitLabel="Entrar"
        altText="¿No tienes cuenta?"
        altHref="/register"
        altLabel="Regístrate"
      />
    </main>
  );
}
