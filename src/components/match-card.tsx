import Link from "next/link";
import { Avatar } from "./avatar";
import { SlotsBadge, isMatchExpired } from "./match-badges";
import { formatMatchDate } from "@/lib/format-date";

type Position = "derecha" | "reves";
const POSITION_LABEL: Record<Position, string> = {
  derecha: "Derecha",
  reves: "Revés",
};
// Equipo 1 (arriba) mira hacia la red; Equipo 2 (abajo) mira hacia la red
// desde el lado opuesto, así que su derecha/revés queda en espejo.
const TEAM_COLUMNS: Record<1 | 2, Position[]> = {
  1: ["derecha", "reves"],
  2: ["reves", "derecha"],
};

type MatchCardPlayer = {
  user_id: string;
  name: string | null;
  team: 1 | 2;
  position: Position;
};

function firstName(name: string | null): string {
  if (!name) return "Sin nombre";
  return name.trim().split(/\s+/)[0] ?? "Sin nombre";
}

export function MatchCard({
  match,
  players,
}: {
  match: {
    id: string;
    court_name: string;
    start_time: string;
    duration_minutes: number;
    min_level: number | null;
    max_level: number | null;
    status: string;
  };
  players: MatchCardPlayer[];
}) {
  const start = new Date(match.start_time);
  const team1 = players.filter((p) => p.team === 1);
  const team2 = players.filter((p) => p.team === 2);
  const joinable =
    match.status === "open" &&
    players.length < 4 &&
    !isMatchExpired(match.status, match.start_time);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 transition-colors">
      <Link
        href={`/matches/${match.id}`}
        className="block active:opacity-80"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {formatMatchDate(start)}
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {start.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <SlotsBadge
            status={match.status}
            playerCount={players.length}
            startTime={match.start_time}
          />
        </div>

        <div className="mt-3 flex flex-row flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 text-foreground/90">
            <span aria-hidden>📍</span>
            {match.court_name}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <span aria-hidden>🕒</span>
            {match.duration_minutes} min
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="inline-flex items-center gap-1 font-semibold text-sky-300">
            <span aria-hidden>📊</span>
            Nivel:{" "}
            {match.min_level !== null && match.max_level !== null
              ? `${match.min_level} - ${match.max_level}`
              : "Todos"}
          </span>
        </div>
      </Link>

      <MiniCourt
        matchId={match.id}
        team1={team1}
        team2={team2}
        joinable={joinable}
      />
    </div>
  );
}

function MiniCourt({
  matchId,
  team1,
  team2,
  joinable,
}: {
  matchId: string;
  team1: MatchCardPlayer[];
  team2: MatchCardPlayer[];
  joinable: boolean;
}) {
  return (
    <div className="mt-3 rounded-xl border border-white/20 bg-emerald-950/60 p-3">
      <TeamRow
        matchId={matchId}
        team={1}
        players={team1}
        joinable={joinable}
      />

      <div className="relative -mx-3 my-2 h-6 overflow-hidden border-t-2 border-white bg-emerald-950/70 bg-[image:repeating-linear-gradient(45deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_1px,transparent_1px,transparent_5px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_1px,transparent_1px,transparent_5px)] shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />

      <TeamRow
        matchId={matchId}
        team={2}
        players={team2}
        joinable={joinable}
      />
    </div>
  );
}

function TeamRow({
  matchId,
  team,
  players,
  joinable,
}: {
  matchId: string;
  team: 1 | 2;
  players: MatchCardPlayer[];
  joinable: boolean;
}) {
  return (
    <div className="grid grid-cols-2 divide-x divide-white/15">
      {TEAM_COLUMNS[team].map((position, index) => {
        const player = players.find((p) => p.position === position);
        const padding = index === 0 ? "pr-1.5" : "pl-1.5";
        return (
          <div key={position} className={padding}>
            {player ? (
              <QuadrantPlayer player={player} />
            ) : (
              <QuadrantEmpty
                matchId={matchId}
                team={team}
                position={position}
                joinable={joinable}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuadrantPlayer({ player }: { player: MatchCardPlayer }) {
  return (
    <div className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-md bg-white/10 p-2 text-center">
      <Avatar name={player.name} seed={player.user_id} size="md" />
      <p className="line-clamp-1 w-full text-sm font-medium leading-none text-foreground/90">
        {firstName(player.name)}
      </p>
    </div>
  );
}

function QuadrantEmpty({
  matchId,
  team,
  position,
  joinable,
}: {
  matchId: string;
  team: 1 | 2;
  position: Position;
  joinable: boolean;
}) {
  const label = POSITION_LABEL[position];

  if (!joinable) {
    return (
      <div className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-white/20 p-2 text-center text-white/50">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-current text-sm leading-none">
          +
        </span>
        <p className="text-xs leading-none">Libre ({label})</p>
      </div>
    );
  }

  return (
    <Link
      href={`/matches/${matchId}?team=${team}&position=${position}`}
      className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-white/20 p-2 text-center text-white/50 transition-colors hover:border-emerald-400/50 hover:text-emerald-300/70 active:border-emerald-400/50 active:text-emerald-300/70"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-current text-sm leading-none">
        +
      </span>
      <p className="text-xs leading-none">Libre ({label})</p>
    </Link>
  );
}
