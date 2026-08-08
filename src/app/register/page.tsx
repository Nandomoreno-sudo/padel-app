import { RegisterForm } from "./register-form";

export default async function RegisterPage(props: PageProps<"/register">) {
  const searchParams = await props.searchParams;
  const code = typeof searchParams.code === "string" ? searchParams.code : "";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <h1 className="text-2xl font-bold">
        <span className="text-emerald-400">🎾</span> Crear cuenta
      </h1>
      <RegisterForm invitationCode={code} />
    </main>
  );
}
