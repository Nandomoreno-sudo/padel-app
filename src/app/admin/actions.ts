"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/dal";

export type CreateInvitationState = { error?: string };

export async function createInvitation(
  _prevState: CreateInvitationState,
  formData: FormData,
): Promise<CreateInvitationState> {
  const { user, supabase } = await requireAdmin();

  const phone = formData.get("phone")?.toString().trim() || null;
  const code = randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

  const { error } = await supabase
    .from("invitations")
    .insert({ code, created_by: user.id, phone });

  if (error) {
    console.error("createInvitation failed:", error);
    // Se muestra el detalle real (código + mensaje de Postgres) en vez de
    // un texto genérico: este panel es solo para admins, así que exponer
    // la causa exacta (p. ej. una columna que falta en la BD) ahorra tener
    // que ir a mirar los logs del servidor.
    return {
      error: `No se ha podido crear la invitación (${error.code}): ${error.message}`,
    };
  }

  revalidatePath("/admin");
  return {};
}
