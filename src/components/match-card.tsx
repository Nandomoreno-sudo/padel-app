import Link from "next/link";
import { Avatar } from "./avatar";
import { SlotsBadge } from "./match-badges";
import { formatMatchDate } from "@/lib/format-date";

const SIDES = ["Derecha", "Revés"] as const;
type Side = (typeof SIDES)[number];
// Equipo 1 (arriba) mira hacia la red; Equipo 2 (abajo) mira hacia la red
// desde el lado opuesto, así que su derecha/revés queda en espejo.
const TEAM1_COLUMNS: Side[] = ["Derecha", "Revés"];
const TEAM2_COLUMNS: Side[] = ["Revés", "Derecha"];

type MatchCardPlayer = { user_id: string; name: string | null; team: 1 | 2 };
type SidedPlayer = MatchCardPlayer & { side: Side };

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
  // No hay un campo de lado (derecha/revés) en la BD: se asigna por orden
  // de inscripción dentro del equipo (el primero entra a la derecha).
  const team1 = assignSides(players.filter((p) => p.team === 1));
  const team2 = assignSides(players.filter((p) => p.team === 2));

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 transition-colors active:bg-surface-hover"
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
        <SlotsBadge status={match.status} playerCount={players.length} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-sm text-foreground/90">
        <span>📍</span>
        {match.court_name}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <span aria-hidden>🕒</span>
          {match.duration_minutes} min
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-300">
          <span aria-hidden>📊</span>
          Nivel:{" "}
          {match.min_level !== null && match.max_level !== null
            ? `${match.min_level} - ${match.max_level}`
            : "Todos"}
        </span>
      </div>

      <MiniCourt team1={team1} team2={team2} />
    </Link>
  );
}

function assignSides(players: MatchCardPlayer[]): SidedPlayer[] {
  return players
    .slice(0, 2)
    .map((player, index) => ({ ...player, side: SIDES[index] }));
}

function MiniCourt({
  team1,
  team2,
}: {
  team1: SidedPlayer[];
  team2: SidedPlayer[];
}) {
  return (
    <div className="mt-3 rounded-xl border border-white/20 bg-emerald-950/60 p-2">
      <TeamRow players={team1} columns={TEAM1_COLUMNS} />

      <div className="my-1.5 flex items-center gap-2">
        <div className="h-0.5 flex-1 bg-white/40" />
        <span className="rounded-full border border-white/30 bg-emerald-950 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white/70">
          RED
        </span>
        <div className="h-0.5 flex-1 bg-white/40" />
      </div>

      <TeamRow players={team2} columns={TEAM2_COLUMNS} />
    </div>
  );
}

function TeamRow({
  players,
  columns,
}: {
  players: SidedPlayer[];
  columns: Side[];
}) {
  return (
    <div className="grid grid-cols-2 divide-x divide-white/15">
      {columns.map((side, index) => {
        const player = players.find((p) => p.side === side);
        const padding = index === 0 ? "pr-1.5" : "pl-1.5";
        return (
          <div key={side} className={padding}>
            {player ? (
              <QuadrantPlayer player={player} />
            ) : (
              <QuadrantEmpty side={side} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuadrantPlayer({ player }: { player: MatchCardPlayer }) {
  return (
    <div className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md bg-white/10 p-1.5 text-center">
      <Avatar name={player.name} seed={player.user_id} size="sm" />
      <p className="line-clamp-1 w-full text-[11px] font-medium leading-none text-foreground/90">
        {firstName(player.name)}
      </p>
    </div>
  );
}

function QuadrantEmpty({ side }: { side: Side }) {
  return (
    <div className="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-white/20 p-1.5 text-center text-white/50 transition-colors hover:border-emerald-400/50 hover:text-emerald-300/70">
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-current text-xs leading-none">
        +
      </span>
      <p className="text-[10px] leading-none">Libre ({side})</p>
    </div>
  );
}
