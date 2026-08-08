import Link from "next/link";
import { SlotsBadge } from "./match-badges";

export function MatchCard({
  match,
  playerCount,
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
  playerCount: number;
}) {
  const start = new Date(match.start_time);

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
        <SlotsBadge status={match.status} playerCount={playerCount} />
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
    </Link>
  );
}
