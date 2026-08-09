import Link from "next/link";
import { Avatar } from "./avatar";
import { SlotsBadge } from "./match-badges";

const MAX_SLOTS = 4;

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
  players: { user_id: string; name: string | null }[];
}) {
  const start = new Date(match.start_time);
  const openSlots = Math.max(0, MAX_SLOTS - players.length);

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

      <div className="mt-3 flex flex-wrap gap-1.5">
        {players.map((player) => (
          <span
            key={player.user_id}
            className="flex items-center gap-1.5 rounded-full border border-border bg-background/40 py-1 pl-1 pr-2.5 text-xs font-medium text-foreground/90"
          >
            <Avatar name={player.name} seed={player.user_id} size="sm" />
            {player.name ?? "Sin nombre"}
          </span>
        ))}
        {Array.from({ length: openSlots }).map((_, index) => (
          <span
            key={`open-${index}`}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-border py-1 pl-1 pr-2.5 text-xs font-medium text-muted-foreground/70"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border text-sm leading-none">
              +
            </span>
            Disponible
          </span>
        ))}
      </div>
    </Link>
  );
}
