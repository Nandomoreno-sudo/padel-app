"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/dal";

export type CreateMatchState = { error?: string };

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

  redirect("/admin/matches");
}
