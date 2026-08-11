"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/dal";
import { sendPushNotifications, deleteStaleSubscriptions } from "@/lib/push/send";

export type CreateMatchState = { error?: string };

const VALID_COURT_NAMES = new Set(
  Array.from({ length: 10 }, (_, i) => `Pista ${i + 1}`),
);

export async function createMatch(
  _prevState: CreateMatchState,
  formData: FormData,
): Promise<CreateMatchState> {
  const { supabase } = await requireAdmin();

  const date = formData.get("date")?.toString();
  const time = formData.get("time")?.toString();
  const courtName = formData.get("courtName")?.toString().trim();
  const durationMinutes = Number(formData.get("duration"));
  const minLevelRaw = formData.get("minLevel")?.toString().trim();
  const maxLevelRaw = formData.get("maxLevel")?.toString().trim();

  if (!date || !time || !courtName || !durationMinutes) {
    return { error: "Completa todos los campos obligatorios." };
  }

  if (!VALID_COURT_NAMES.has(courtName)) {
    return { error: "Selecciona una pista válida (1 a 10)." };
  }

  const startTime = new Date(`${date}T${time}`);
  if (Number.isNaN(startTime.getTime())) {
    return { error: "Fecha u hora no válidas." };
  }

  const minLevel = minLevelRaw ? Number(minLevelRaw) : null;
  const maxLevel = maxLevelRaw ? Number(maxLevelRaw) : null;

  if (minLevel !== null && maxLevel !== null && minLevel > maxLevel) {
    return { error: "El nivel mínimo no puede ser mayor que el máximo." };
  }

  const { error } = await supabase.from("matches").insert({
    court_name: courtName,
    start_time: startTime.toISOString(),
    duration_minutes: durationMinutes,
    min_level: minLevel,
    max_level: maxLevel,
  });

  if (error) {
    return { error: "No se ha podido crear el partido." };
  }

  const { data: allSubs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (subsError) {
    console.error("push_subscriptions fetch failed:", subsError);
  } else if (allSubs && allSubs.length > 0) {
    const dateLabel = startTime.toLocaleString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const staleEndpoints = await sendPushNotifications(allSubs, {
      title: "🎾 Nuevo partido disponible",
      body: `🎾 ¡Nuevo partido disponible! ${dateLabel} - ${courtName}`,
      url: "/",
    });
    await deleteStaleSubscriptions(supabase, staleEndpoints);
  }

  redirect("/admin/matches");
}
