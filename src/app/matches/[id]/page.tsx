import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchStatusBadge } from "@/components/match-badges";
import { MatchActions } from "./match-actions";
import { AddToCalendarButton } from "./add-to-calendar-button";
import { NotifyWhatsAppButton } from "./notify-whatsapp-button";
import { DeleteMatchButton } from "./delete-match-button";
import { formatMatchDate } from "@/lib/format-date";

const RESULTS_LINK_LABELS: Record<string, string> = {
  full: "Introducir resultado",
  pending_result: "Revisar resultado propuesto",
  finished: "Ver resultado",
};

type Position = "derecha" | "reves";

type MatchPlayer = {
  user_id: string;
  team: number;
  position: Position;
  confirmed_attendance: boolean;
  profiles: { name: string | null; level: number } | null;
};

export default async function MatchPage(props: PageProps<"/matches/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
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
        .select(
          "user_id, team, position, confirmed_attendance, profiles(name, level)",
        )
        .eq("match_id", id),
    ]);

  if (!match) {
    notFound();
  }

  const playerList = (players ?? []) as unknown as MatchPlayer[];
  const team1 = playerList.filter((p) => p.team === 1);
  const team2 = playerList.filter((p) => p.team === 2);
  const registration = playerList.find((p) => p.user_id === user.id);

  const teamParam = searchParams.team;
  const positionParam = searchParams.position;
  const initialTeam = teamParam === "1" ? 1 : teamParam === "2" ? 2 : null;
  const initialPosition =
    positionParam === "derecha" || positionParam === "reves"
      ? positionParam
      : null;

  const level = profile?.level ?? null;
  const levelOutOfRange =
    level !== null &&
    ((match.min_level !== null && level < match.min_level) ||
      (match.max_level !== null && level > match.max_level));

  const startDate = new Date(match.start_time);
  const hasStarted = startDate <= new Date();

  let joinBlockedReason: string | null = null;
  if (match.status !== "open") {
    joinBlockedReason = "Este partido no admite más inscripciones.";
  } else if (hasStarted) {
    joinBlockedReason =
      "El partido ya ha comenzado y no admite más inscripciones.";
  } else if (levelOutOfRange) {
    joinBlockedReason = `Tu nivel (${level}) no está dentro del rango permitido (${match.min_level ?? "—"} - ${match.max_level ?? "—"}).`;
  } else if (team1.length >= 2 && team2.length >= 2) {
    joinBlockedReason = "El partido está completo.";
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6 pb-8">
      <MatchActions
        matchId={match.id}
        team1={team1}
        team2={team2}
        registration={
          registration
            ? {
                team: registration.team,
                confirmedAttendance: registration.confirmed_attendance,
              }
            : null
        }
        joinBlockedReason={joinBlockedReason}
        initialTeam={initialTeam}
        initialPosition={initialPosition}
        headerContent={
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-bold">{match.court_name}</h1>
              <MatchStatusBadge
                status={match.status}
                startTime={match.start_time}
              />
            </div>
            <p className="text-sm text-zinc-300">
              {formatMatchDate(startDate)} ·{" "}
              {startDate.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · {match.duration_minutes} min
            </p>
            <p className="text-sm text-zinc-300">
              Nivel:{" "}
              {match.min_level !== null && match.max_level !== null
                ? `${match.min_level} - ${match.max_level}`
                : "Todos los niveles"}
            </p>
          </div>
        }
      />

      {profile?.is_admin && (
        <div className="space-y-3">
          <NotifyWhatsAppButton
            matchId={match.id}
            courtName={match.court_name}
            startTime={match.start_time}
            playerCount={playerList.length}
            status={match.status}
          />
          <DeleteMatchButton matchId={match.id} />
        </div>
      )}

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
