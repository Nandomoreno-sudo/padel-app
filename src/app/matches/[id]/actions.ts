"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MatchActionState = { error?: string };

export async function joinMatch(
  matchId: string,
  _prevState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  const teamRaw = formData.get("team");
  const team = teamRaw === "1" ? 1 : teamRaw === "2" ? 2 : null;
  if (!team) {
    return { error: "Selecciona un equipo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Debes iniciar sesión." };
  }

  const [{ data: profile }, { data: match }, { data: existingPlayers }] =
    await Promise.all([
      supabase.from("profiles").select("level").eq("id", user.id).single(),
      supabase
        .from("matches")
        .select("status, min_level, max_level")
        .eq("id", matchId)
        .single(),
      supabase
        .from("match_players")
        .select("user_id, team")
        .eq("match_id", matchId),
    ]);

  if (!match) {
    return { error: "El partido no existe." };
  }
  if (match.status !== "open") {
    return { error: "Este partido no admite más inscripciones." };
  }

  const players = existingPlayers ?? [];
  if (players.some((p) => p.user_id === user.id)) {
    return { error: "Ya estás inscrito en este partido." };
  }
  if (players.filter((p) => p.team === team).length >= 2) {
    return { error: `El equipo ${team} ya está completo.` };
  }

  const level = profile?.level ?? null;
  if (
    level !== null &&
    ((match.min_level !== null && level < match.min_level) ||
      (match.max_level !== null && level > match.max_level))
  ) {
    return { error: "Tu nivel no está dentro del rango permitido." };
  }

  const { error } = await supabase.from("match_players").insert({
    match_id: matchId,
    user_id: user.id,
    team,
  });

  if (error) {
    return { error: "No se ha podido completar la inscripción." };
  }

  revalidatePath(`/matches/${matchId}`);
  return {};
}

export async function leaveMatch(
  matchId: string,
  _prevState: MatchActionState,
  _formData: FormData,
): Promise<MatchActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Debes iniciar sesión." };
  }

  const { error } = await supabase
    .from("match_players")
    .delete()
    .eq("match_id", matchId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "No se ha podido cancelar la inscripción." };
  }

  revalidatePath(`/matches/${matchId}`);
  return {};
}

export async function confirmAttendance(
  matchId: string,
  _prevState: MatchActionState,
  _formData: FormData,
): Promise<MatchActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Debes iniciar sesión." };
  }

  const { error } = await supabase
    .from("match_players")
    .update({ confirmed_attendance: true })
    .eq("match_id", matchId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "No se ha podido confirmar la asistencia." };
  }

  revalidatePath(`/matches/${matchId}`);
  return {};
}
