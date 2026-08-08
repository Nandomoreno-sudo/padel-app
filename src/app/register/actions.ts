"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RegisterActionState = {
  error?: string;
  message?: string;
};

export async function register(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const invitationCode = formData.get("invitationCode")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!invitationCode || !name || !email || !password) {
    return { error: "Completa todos los campos obligatorios." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        invitation_code: invitationCode,
        name,
        phone,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("invitation code")) {
      return {
        error: "El código de invitación no es válido o ya se ha utilizado.",
      };
    }
    return { error: error.message };
  }

  if (data.session) {
    redirect("/");
  }

  return {
    message:
      "Cuenta creada. Revisa tu correo para confirmar tu email antes de iniciar sesión.",
  };
}
