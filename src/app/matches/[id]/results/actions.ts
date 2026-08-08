"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateNewLevels, toSetScores } from "@/lib/level-calculator";

export type ResultActionState = { error?: string };

function parseSet(
  formData: FormData,
  prefix: string,
): { team1: number; team2: number } | null | undefined {
  const rawTeam1 = formData.get(`${prefix}Team1`)?.toString().trim();
  const rawTeam2 = formData.get(`${prefix}Team2`)?.toString().trim();

  if (!rawTeam1 && !rawTeam2) return null;
  if (!rawTeam1 || !rawTeam2) return undefined;

  const team1 = Number(rawTeam1);
  const team2 = Number(rawTeam2);
  if (
    !Number.isInteger(team1) ||
    !Number.isInteger(team2) ||
    team1 < 0 ||
    team2 < 0
  ) {
    return undefined;
  }
  return { team1, team2 };
}

export async function submitResult(
  matchId: string,
  _prevState: ResultActionState,
  formData: FormData,
): Promise<ResultActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const set1 = parseSet(formData, "set1");
  const set2 = parseSet(formData, "set2");
  const set3 = parseSet(formData, "set3");

  if (set3 === undefined) {
    return { error: "Introduce ambos marcadores del Set 3, o déjalo vacío." };
  }
  if (!set1 || !set2) {
    return { error: "Introduce el resultado del Set 1 y el Set 2." };
  }

  const { error } = await supabase.rpc("submit_match_result", {
    p_match_id: matchId,
    p_set1_team1: set1.team1,
    p_set1_team2: set1.team2,
    p_set2_team1: set2.team1,
    p_set2_team2: set2.team2,
    p_set3_team1: set3?.team1 ?? null,
    p_set3_team2: set3?.team2 ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/matches/${matchId}/results`);
  revalidatePath(`/matches/${matchId}`);
  return {};
}

export async function approveResult(
  matchId: string,
  _prevState: ResultActionState,
  _formData: FormData,
): Promise<ResultActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const [{ data: result }, { data: players }] = await Promise.all([
    supabase
      .from("match_results")
      .select(
        "set1_team1, set1_team2, set2_team1, set2_team2, set3_team1, set3_team2, submitted_by",
      )
      .eq("match_id", matchId)
      .maybeSingle(),
    supabase
      .from("match_players")
      .select("user_id, team, profiles(level)")
      .eq("match_id", matchId),
  ]);

  if (!result) {
    return { error: "No hay ningún resultado pendiente para este partido." };
  }

  type MatchPlayerWithLevel = {
    user_id: string;
    team: number;
    profiles: { level: number } | null;
  };

  const playerList = (players ?? []) as unknown as MatchPlayerWithLevel[];
  const team1 = playerList.filter((p) => p.team === 1);
  const team2 = playerList.filter((p) => p.team === 2);

  if (team1.length !== 2 || team2.length !== 2) {
    return { error: "El partido no tiene 4 jugadores inscritos." };
  }

  const levelUpdates = calculateNewLevels({
    team1: [
      { userId: team1[0].user_id, level: team1[0].profiles?.level ?? 2.5 },
      { userId: team1[1].user_id, level: team1[1].profiles?.level ?? 2.5 },
    ],
    team2: [
      { userId: team2[0].user_id, level: team2[0].profiles?.level ?? 2.5 },
      { userId: team2[1].user_id, level: team2[1].profiles?.level ?? 2.5 },
    ],
    sets: toSetScores(result),
  }).map(({ userId, newLevel }) => ({ user_id: userId, level: newLevel }));

  const { error } = await supabase.rpc("approve_match_result", {
    p_match_id: matchId,
    p_level_updates: levelUpdates,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/matches/${matchId}/results`);
  revalidatePath(`/matches/${matchId}`);
  return {};
}

export async function disputeResult(
  matchId: string,
  _prevState: ResultActionState,
  _formData: FormData,
): Promise<ResultActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { error } = await supabase.rpc("dispute_match_result", {
    p_match_id: matchId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/matches/${matchId}/results`);
  revalidatePath(`/matches/${matchId}`);
  return {};
}
