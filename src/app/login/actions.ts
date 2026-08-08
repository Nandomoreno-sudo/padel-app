"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginActionState = {
  error?: string;
  message?: string;
};

export async function signInWithPassword(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const next = formData.get("next")?.toString() || "/";

  if (!email || !password) {
    return { error: "Introduce tu email y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  redirect(next);
}

export async function signInWithMagicLink(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = formData.get("email")?.toString().trim();
  const next = formData.get("next")?.toString() || "/";

  if (!email) {
    return { error: "Introduce tu email." };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { error: "No se ha podido enviar el enlace. Inténtalo de nuevo." };
  }

  return { message: "Revisa tu correo y pulsa el enlace para acceder." };
}
