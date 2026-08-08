import { LoginForm } from "./login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next =
    typeof searchParams.next === "string" ? searchParams.next : "/";
  const hasAuthError = searchParams.error === "auth";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <h1 className="text-2xl font-bold">
        <span className="text-emerald-400">🎾</span> Iniciar sesión
      </h1>
      {hasAuthError && (
        <p className="max-w-sm text-center text-sm text-red-400">
          El enlace no es válido o ha caducado. Solicita uno nuevo.
        </p>
      )}
      <LoginForm next={next} />
    </main>
  );
}
