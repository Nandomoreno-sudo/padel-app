import Link from "next/link";
import { Avatar } from "./avatar";
import { SlotsBadge } from "./match-badges";

const SIDES = ["Derecha", "Revés"] as const;

type MatchCardPlayer = { user_id: string; name: string | null; team: 1 | 2 };

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
  const team1 = players.filter((p) => p.team === 1);
  const team2 = players.filter((p) => p.team === 2);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 transition-colors active:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium capitalize text-muted-foreground">
            {start.toLocaleDateString("es-ES", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            })}
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
      <div className="mt-1 text-sm text-muted-foreground">
        {match.duration_minutes} min · Nivel{" "}
        {match.min_level !== null && match.max_level !== null
          ? `${match.min_level} - ${match.max_level}`
          : "todos"}
      </div>

      <MiniCourt team1={team1} team2={team2} />
    </Link>
  );
}

function MiniCourt({
  team1,
  team2,
}: {
  team1: MatchCardPlayer[];
  team2: MatchCardPlayer[];
}) {
  return (
    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 via-transparent to-emerald-500/10 p-2">
      <TeamRow players={team1} />

      <div className="my-1.5 flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground">
          RED
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <TeamRow players={team2} />
    </div>
  );
}

function TeamRow({ players }: { players: MatchCardPlayer[] }) {
  const slots = [players[0] ?? null, players[1] ?? null];

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {slots.map((player, index) =>
        player ? (
          <QuadrantPlayer key={player.user_id} player={player} />
        ) : (
          <QuadrantEmpty key={index} side={SIDES[index]} />
        ),
      )}
    </div>
  );
}

function QuadrantPlayer({ player }: { player: MatchCardPlayer }) {
  return (
    <div className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-background/40 p-1.5 text-center">
      <Avatar name={player.name} seed={player.user_id} size="sm" />
      <p className="line-clamp-1 w-full text-[11px] font-medium leading-none text-foreground/90">
        {firstName(player.name)}
      </p>
    </div>
  );
}

function QuadrantEmpty({ side }: { side: (typeof SIDES)[number] }) {
  return (
    <div className="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border p-1.5 text-center text-muted-foreground/70 transition-colors hover:border-emerald-500/40 hover:text-emerald-300/70">
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-current text-xs leading-none">
        +
      </span>
      <p className="text-[10px] leading-none">Libre ({side})</p>
    </div>
  );
}
