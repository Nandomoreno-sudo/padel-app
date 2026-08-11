"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/dal";
import { formatMatchDate } from "@/lib/format-date";
import { sendPushNotifications, deleteStaleSubscriptions } from "@/lib/push/send";

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

  const positionRaw = formData.get("position");
  const position =
    positionRaw === "derecha" || positionRaw === "reves" ? positionRaw : null;
  if (!position) {
    return { error: "Selecciona una posición (Derecha o Revés)." };
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
      supabase.from("profiles").select("name, level").eq("id", user.id).single(),
      supabase
        .from("matches")
        .select("status, min_level, max_level, start_time")
        .eq("id", matchId)
        .single(),
      supabase
        .from("match_players")
        .select("user_id, team, position")
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
  if (players.some((p) => p.team === team && p.position === position)) {
    return {
      error: `La posición de ${position === "derecha" ? "Derecha" : "Revés"} del equipo ${team} ya está ocupada.`,
    };
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
    position,
  });

  if (error) {
    return { error: "No se ha podido completar la inscripción." };
  }

  const remaining = Math.max(0, 4 - (players.length + 1));
  const spotsText =
    remaining === 0
      ? "El partido está completo."
      : remaining === 1
        ? "Queda 1 plaza libre."
        : `Quedan ${remaining} plazas libres.`;
  const message = `🎾 ¡${profile?.name ?? "Un jugador"} se ha unido a tu partido del ${formatMatchDate(match.start_time)}! ${spotsText}`;

  const { error: notifyError } = await supabase.rpc("notify_match_players", {
    p_match_id: matchId,
    p_message: message,
  });
  if (notifyError) {
    console.error("notify_match_players failed:", notifyError);
  }

  const { data: pushSubs, error: pushSubsError } = await supabase.rpc(
    "get_match_push_subscriptions",
    { p_match_id: matchId, p_exclude_user_id: user.id },
  );
  if (pushSubsError) {
    console.error("get_match_push_subscriptions failed:", pushSubsError);
  } else if (pushSubs && pushSubs.length > 0) {
    const staleEndpoints = await sendPushNotifications(pushSubs, {
      title: "🎾 Nuevo jugador en tu partido",
      body: message,
      url: `/matches/${matchId}`,
    });
    await deleteStaleSubscriptions(supabase, staleEndpoints);
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

export async function deleteMatch(
  matchId: string,
  _prevState: MatchActionState,
  _formData: FormData,
): Promise<MatchActionState> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("matches").delete().eq("id", matchId);

  if (error) {
    console.error("deleteMatch failed:", error);
    return {
      error: `No se ha podido eliminar el partido (${error.code}): ${error.message}`,
    };
  }

  revalidatePath("/");
  redirect("/");
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
