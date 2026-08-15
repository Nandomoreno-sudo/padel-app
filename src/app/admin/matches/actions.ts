"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/dal";
import { sendPushNotifications, deleteStaleSubscriptions } from "@/lib/push/send";

export type CreateMatchState = { error?: string };
export type CreateMatchesBatchState = { error?: string };

const VALID_COURT_NAMES = new Set(
  Array.from({ length: 10 }, (_, i) => `Pista ${i + 1}`),
);

type ParsedMatch = {
  courtName: string;
  startTime: Date;
  durationMinutes: number;
  minLevel: number | null;
  maxLevel: number | null;
};

// Shared by the single-match and weekly-batch flows so the validation rules
// (valid court, min <= max level, etc.) only live in one place.
function parseMatchFields(fields: {
  date: string;
  time: string;
  courtName: string;
  duration: string;
  minLevel: string;
  maxLevel: string;
}): { match: ParsedMatch } | { error: string } {
  const date = fields.date;
  const time = fields.time;
  const courtName = fields.courtName.trim();
  const durationMinutes = Number(fields.duration);
  const minLevelRaw = fields.minLevel.trim();
  const maxLevelRaw = fields.maxLevel.trim();

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

  return {
    match: { courtName, startTime, durationMinutes, minLevel, maxLevel },
  };
}

export async function createMatch(
  _prevState: CreateMatchState,
  formData: FormData,
): Promise<CreateMatchState> {
  const { supabase } = await requireAdmin();

  const parsed = parseMatchFields({
    date: formData.get("date")?.toString() ?? "",
    time: formData.get("time")?.toString() ?? "",
    courtName: formData.get("courtName")?.toString() ?? "",
    duration: formData.get("duration")?.toString() ?? "",
    minLevel: formData.get("minLevel")?.toString() ?? "",
    maxLevel: formData.get("maxLevel")?.toString() ?? "",
  });
  if ("error" in parsed) {
    return parsed;
  }
  const { match } = parsed;

  const { error } = await supabase.from("matches").insert({
    court_name: match.courtName,
    start_time: match.startTime.toISOString(),
    duration_minutes: match.durationMinutes,
    min_level: match.minLevel,
    max_level: match.maxLevel,
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
    const dateLabel = match.startTime.toLocaleString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const staleEndpoints = await sendPushNotifications(allSubs, {
      title: "🎾 Nuevo partido disponible",
      body: `🎾 ¡Nuevo partido disponible! ${dateLabel} - ${match.courtName}`,
      url: "/",
    });
    await deleteStaleSubscriptions(supabase, staleEndpoints);
  }

  redirect("/admin/matches");
}

// Inserts a whole batch of matches (e.g. a duplicated week) in one go and
// sends a single grouped push notification, instead of one push per match
// like the ad-hoc createMatch flow above.
export async function createMatchesBatch(
  _prevState: CreateMatchesBatchState,
  formData: FormData,
): Promise<CreateMatchesBatchState> {
  const { supabase } = await requireAdmin();

  const rowsRaw = formData.get("rows")?.toString();
  if (!rowsRaw) {
    return { error: "No hay partidos para crear." };
  }

  let rawRows: unknown;
  try {
    rawRows = JSON.parse(rowsRaw);
  } catch {
    return { error: "Datos no válidos." };
  }

  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return { error: "Añade al menos un partido." };
  }

  const matches: ParsedMatch[] = [];
  for (const row of rawRows) {
    if (typeof row !== "object" || row === null) {
      return { error: "Datos no válidos." };
    }
    const r = row as Record<string, unknown>;
    const parsed = parseMatchFields({
      date: String(r.date ?? ""),
      time: String(r.time ?? ""),
      courtName: String(r.courtName ?? ""),
      duration: String(r.duration ?? ""),
      minLevel: String(r.minLevel ?? ""),
      maxLevel: String(r.maxLevel ?? ""),
    });
    if ("error" in parsed) {
      return parsed;
    }
    matches.push(parsed.match);
  }

  const { error } = await supabase.from("matches").insert(
    matches.map((match) => ({
      court_name: match.courtName,
      start_time: match.startTime.toISOString(),
      duration_minutes: match.durationMinutes,
      min_level: match.minLevel,
      max_level: match.maxLevel,
    })),
  );

  if (error) {
    return { error: "No se han podido crear los partidos." };
  }

  const { data: allSubs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (subsError) {
    console.error("push_subscriptions fetch failed:", subsError);
  } else if (allSubs && allSubs.length > 0) {
    const staleEndpoints = await sendPushNotifications(allSubs, {
      title: "🎾 Nuevas pistas esta semana",
      body: `🎾 ${matches.length} pistas nuevas esta semana — entra a apuntarte`,
      url: "/",
    });
    await deleteStaleSubscriptions(supabase, staleEndpoints);
  }

  redirect("/admin/matches");
}
