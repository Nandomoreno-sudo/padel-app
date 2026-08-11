import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchCard } from "@/components/match-card";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, court_name, start_time, duration_minutes, min_level, max_level, status",
    )
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  const matchIds = (matches ?? []).map((match) => match.id);

  const { data: players } =
    matchIds.length > 0
      ? await supabase
          .from("match_players")
          .select("match_id, user_id, team, position, profiles(name)")
          .in("match_id", matchIds)
          .order("registered_at", { ascending: true })
      : { data: [] };

  type Position = "derecha" | "reves";

  type MatchPlayerRow = {
    match_id: string;
    user_id: string;
    team: 1 | 2;
    position: Position;
    profiles: { name: string | null } | null;
  };

  const playersByMatch = new Map<
    string,
    { user_id: string; name: string | null; team: 1 | 2; position: Position }[]
  >();
  for (const player of (players ?? []) as unknown as MatchPlayerRow[]) {
    const list = playersByMatch.get(player.match_id) ?? [];
    list.push({
      user_id: player.user_id,
      name: player.profiles?.name ?? null,
      team: player.team,
      position: player.position,
    });
    playersByMatch.set(player.match_id, list);
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 py-6 pb-8">
      <h1 className="text-2xl font-bold">Partidos</h1>

      <div className="space-y-3">
        {(matches ?? []).map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            players={playersByMatch.get(match.id) ?? []}
          />
        ))}

        {(matches ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay partidos programados todavía.
          </p>
        )}
      </div>
    </main>
  );
}
