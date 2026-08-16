"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { LEVEL_OPTIONS } from "./level-options";

export type RegisterActionState = {
  error?: string;
  message?: string;
};

const VALID_LEVEL_VALUES = new Set<string>(
  LEVEL_OPTIONS.map((o) => o.value),
);

export async function register(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const invitationCode = formData
    .get("invitationCode")
    ?.toString()
    .trim()
    .toUpperCase();
  const name = formData.get("name")?.toString().trim();
  const rawPhone = formData.get("phone")?.toString().trim();
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const level = formData.get("level")?.toString().trim();

  if (!invitationCode || !name || !email || !password || !level) {
    return { error: "Completa todos los campos obligatorios." };
  }

  if (!VALID_LEVEL_VALUES.has(level)) {
    return { error: "Selecciona un nivel válido." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();

  // Validated up front via RPC (bypassing RLS, since there's no session
  // yet) instead of just letting handle_new_user's trigger reject it:
  // Supabase Auth wraps any trigger exception into an opaque "Database
  // error saving new user", which would otherwise hide the real reason.
  const { data: validation, error: validationError } = await supabase.rpc(
    "validate_invitation_code",
    { p_code: invitationCode },
  );

  if (validationError) {
    console.error("validate_invitation_code failed:", validationError);
    return {
      error: `No se ha podido verificar el código de invitación (${validationError.code}): ${validationError.message}`,
    };
  }

  if (validation === "invalid") {
    return { error: "El código de invitación no es válido." };
  }
  if (validation === "used") {
    return { error: "Este código de invitación ya se ha utilizado." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        invitation_code: invitationCode,
        name,
        phone,
        level,
      },
    },
  });

  if (error) {
    console.error("register signUp failed:", error);
    if (error.code === "user_already_exists") {
      return {
        error: "Ya existe una cuenta con este email. Inicia sesión en su lugar.",
      };
    }
    return {
      error: `No se ha podido crear la cuenta (${error.code ?? error.status}): ${error.message}`,
    };
  }

  // With email confirmations on, Supabase Auth returns a fake "success" for
  // an email that's already registered (no error, to avoid leaking which
  // emails exist) — the empty `identities` array is the only tell.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      error: "Ya existe una cuenta con este email. Inicia sesión en su lugar.",
    };
  }

  if (data.session) {
    redirect("/");
  }

  return {
    message:
      "Cuenta creada. Revisa tu correo para confirmar tu email antes de iniciar sesión.",
  };
}
