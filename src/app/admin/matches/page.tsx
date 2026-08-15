import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/dal";
import { Avatar } from "@/components/avatar";
import { SlotsBadge } from "@/components/match-badges";
import { ShareWhatsAppButton } from "./share-whatsapp-button";
import { ShareWeekWhatsAppButton } from "./share-week-whatsapp-button";

export default async function AdminMatchesPage() {
  const { supabase } = await requireAdmin();

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, court_name, start_time, duration_minutes, min_level, max_level, status",
    )
    .order("start_time", { ascending: true });

  const matchIds = (matches ?? []).map((match) => match.id);

  const { data: players } =
    matchIds.length > 0
      ? await supabase
          .from("match_players")
          .select("match_id, user_id, team, confirmed_attendance")
          .in("match_id", matchIds)
      : { data: [] };

  const userIds = [...new Set((players ?? []).map((p) => p.user_id))];

  const namesById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);
    for (const profile of profiles ?? []) {
      namesById.set(profile.id, profile.name ?? "Sin nombre");
    }
  }

  const playersByMatch = new Map<string, typeof players>();
  for (const player of players ?? []) {
    const list = playersByMatch.get(player.match_id) ?? [];
    list.push(player);
    playersByMatch.set(player.match_id, list);
  }

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekMatches = (matches ?? []).filter((match) => {
    const start = new Date(match.start_time);
    return match.status !== "cancelled" && start >= now && start <= weekFromNow;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Partidos</h1>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/matches/week"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold text-foreground hover:bg-surface-hover"
          >
            Duplicar semana anterior
          </Link>
          <Link
            href="/admin/matches/new"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
          >
            Nuevo partido
          </Link>
        </div>
      </div>

      <ShareWeekWhatsAppButton matches={weekMatches} />

      <div className="space-y-4">
        {(matches ?? []).map((match) => {
          const matchPlayers = playersByMatch.get(match.id) ?? [];
          const start = new Date(match.start_time);

          return (
            <div
              key={match.id}
              className="space-y-4 rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {start.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    ·{" "}
                    {start.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {match.court_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {match.duration_minutes} min · Nivel{" "}
                    {match.min_level !== null && match.max_level !== null
                      ? `${match.min_level} - ${match.max_level}`
                      : "todos"}
                  </p>
                </div>
                <SlotsBadge
                  status={match.status}
                  playerCount={matchPlayers.length}
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Apuntados ({matchPlayers.length}/4)
                </p>
                {matchPlayers.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {matchPlayers.map((player) => (
                      <li
                        key={player.user_id}
                        className="flex items-center gap-2 rounded-full border border-border bg-background/40 py-1 pl-1 pr-3 text-sm"
                      >
                        <Avatar
                          name={namesById.get(player.user_id)}
                          seed={player.user_id}
                          size="sm"
                        />
                        <span>
                          {namesById.get(player.user_id) ?? "Sin nombre"} ·
                          equipo {player.team}
                          {player.confirmed_attendance ? " · ✓" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nadie se ha apuntado todavía.
                  </p>
                )}
              </div>

              <ShareWhatsAppButton
                matchId={match.id}
                courtName={match.court_name}
                startTime={match.start_time}
                minLevel={match.min_level}
                maxLevel={match.max_level}
              />
            </div>
          );
        })}

        {(matches ?? []).length === 0 && (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            Todavía no se ha creado ningún partido.
          </p>
        )}
      </div>
    </div>
  );
}
