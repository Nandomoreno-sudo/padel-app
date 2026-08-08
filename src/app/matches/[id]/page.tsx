import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { LevelBadge } from "@/components/level-badge";
import { MatchStatusBadge } from "@/components/match-badges";
import { MatchActions } from "./match-actions";
import { AddToCalendarButton } from "./add-to-calendar-button";

const RESULTS_LINK_LABELS: Record<string, string> = {
  full: "Introducir resultado",
  pending_result: "Revisar resultado propuesto",
  finished: "Ver resultado",
};

type MatchPlayer = {
  user_id: string;
  team: number;
  confirmed_attendance: boolean;
  profiles: { name: string | null; level: number } | null;
};

export default async function MatchPage(props: PageProps<"/matches/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: match }, { data: profile }, { data: players }] =
    await Promise.all([
      supabase
        .from("matches")
        .select(
          "id, court_name, start_time, duration_minutes, min_level, max_level, status",
        )
        .eq("id", id)
        .single(),
      supabase
        .from("profiles")
        .select("level, is_admin")
        .eq("id", user.id)
        .single(),
      supabase
        .from("match_players")
        .select("user_id, team, confirmed_attendance, profiles(name, level)")
        .eq("match_id", id),
    ]);

  if (!match) {
    notFound();
  }

  const playerList = (players ?? []) as unknown as MatchPlayer[];
  const team1 = playerList.filter((p) => p.team === 1);
  const team2 = playerList.filter((p) => p.team === 2);
  const registration = playerList.find((p) => p.user_id === user.id);

  const level = profile?.level ?? null;
  const levelOutOfRange =
    level !== null &&
    ((match.min_level !== null && level < match.min_level) ||
      (match.max_level !== null && level > match.max_level));

  let joinBlockedReason: string | null = null;
  if (match.status !== "open") {
    joinBlockedReason = "Este partido no admite más inscripciones.";
  } else if (levelOutOfRange) {
    joinBlockedReason = `Tu nivel (${level}) no está dentro del rango permitido (${match.min_level ?? "—"} - ${match.max_level ?? "—"}).`;
  } else if (team1.length >= 2 && team2.length >= 2) {
    joinBlockedReason = "El partido está completo.";
  }

  const startDate = new Date(match.start_time);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6 pb-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{match.court_name}</h1>
          <MatchStatusBadge status={match.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {startDate.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
          })}{" "}
          ·{" "}
          {startDate.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {match.duration_minutes} min
        </p>
        <p className="text-sm text-muted-foreground">
          Nivel:{" "}
          {match.min_level !== null && match.max_level !== null
            ? `${match.min_level} - ${match.max_level}`
            : "Todos los niveles"}
        </p>
      </div>

      <Court team1={team1} team2={team2} />

      <MatchActions
        matchId={match.id}
        registration={
          registration
            ? {
                team: registration.team,
                confirmedAttendance: registration.confirmed_attendance,
              }
            : null
        }
        team1Full={team1.length >= 2}
        team2Full={team2.length >= 2}
        joinBlockedReason={joinBlockedReason}
      />

      {registration && (
        <AddToCalendarButton
          title={`Partido de pádel - ${match.court_name}`}
          location={match.court_name}
          startTime={match.start_time}
          durationMinutes={match.duration_minutes}
          playerNames={playerList
            .map((p) => p.profiles?.name)
            .filter((name): name is string => Boolean(name))}
        />
      )}

      {RESULTS_LINK_LABELS[match.status] && (
        <div className="border-t border-border pt-4">
          <Link
            href={`/matches/${match.id}/results`}
            className="text-sm font-medium text-emerald-400 underline underline-offset-4"
          >
            {RESULTS_LINK_LABELS[match.status]}
          </Link>
        </div>
      )}
    </main>
  );
}

function Court({
  team1,
  team2,
}: {
  team1: MatchPlayer[];
  team2: MatchPlayer[];
}) {
  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 via-transparent to-emerald-500/10 p-4">
      <TeamRow title="Equipo 1" players={team1} />

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
          RED
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <TeamRow title="Equipo 2" players={team2} />
    </div>
  );
}

function TeamRow({ title, players }: { title: string; players: MatchPlayer[] }) {
  const slots = [players[0] ?? null, players[1] ?? null];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {slots.map((player, index) =>
          player ? (
            <PlayerCard key={player.user_id} player={player} />
          ) : (
            <EmptySlotCard key={index} />
          ),
        )}
      </div>
    </div>
  );
}

function PlayerCard({ player }: { player: MatchPlayer }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-center">
      <Avatar
        name={player.profiles?.name}
        seed={player.user_id}
        size="lg"
      />
      <p className="line-clamp-1 w-full text-sm font-medium">
        {player.profiles?.name ?? "Sin nombre"}
      </p>
      <LevelBadge level={player.profiles?.level} />
      {player.confirmed_attendance && (
        <span className="text-[11px] font-medium text-emerald-400">
          ✓ Confirmado
        </span>
      )}
    </div>
  );
}

function EmptySlotCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-3 text-center text-muted-foreground">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-border text-lg leading-none">
        +
      </span>
      <p className="text-xs">Hueco libre</p>
    </div>
  );
}
