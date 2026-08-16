export const MATCH_STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  full: "Completo",
  pending_result: "Resultado pendiente",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const STATUS_TONES: Record<string, string> = {
  open: "bg-emerald-500/15 text-emerald-300",
  full: "bg-red-500/15 text-red-300",
  pending_result: "bg-amber-500/15 text-amber-300",
  finished: "bg-white/10 text-muted-foreground",
  cancelled: "bg-red-500/10 text-red-400/70",
};

// A match is still "open" in the DB (nobody filled the last slot) but its
// start time has already passed, so it can no longer accept sign-ups even
// though a status transition never fired for it.
export function isMatchExpired(status: string, startTime: string): boolean {
  return status === "open" && new Date(startTime) <= new Date();
}

function ClosedBadge() {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      Cerrado / En curso
    </span>
  );
}

export function MatchStatusBadge({
  status,
  startTime,
}: {
  status: string;
  startTime?: string;
}) {
  if (startTime && isMatchExpired(status, startTime)) {
    return <ClosedBadge />;
  }

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONES[status] ?? "bg-white/10 text-muted-foreground"}`}
    >
      {MATCH_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// Green = plenty of room (3-4 free), orange = running low (1-2 free), red =
// full. Falls back to the general status badge once the match isn't
// open/full anymore (e.g. pending_result, finished) since "plazas
// restantes" no longer applies.
export function SlotsBadge({
  status,
  playerCount,
  startTime,
}: {
  status: string;
  playerCount: number;
  startTime?: string;
}) {
  if (startTime && isMatchExpired(status, startTime)) {
    return <ClosedBadge />;
  }

  if (status !== "open" && status !== "full") {
    return <MatchStatusBadge status={status} />;
  }

  const remaining = Math.max(0, 4 - playerCount);

  if (remaining === 0) {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300">
        Completo
      </span>
    );
  }

  if (remaining <= 2) {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-300">
        {remaining === 1 ? "¡Última plaza!" : `${remaining} plazas libres`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
      {remaining} plazas libres
    </span>
  );
}
