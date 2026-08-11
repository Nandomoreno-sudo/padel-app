"use client";

import { useActionState, useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { LevelBadge } from "@/components/level-badge";
import { Button } from "@/components/ui/button";
import {
  joinMatch,
  leaveMatch,
  confirmAttendance,
  type MatchActionState,
} from "./actions";

type Position = "derecha" | "reves";

type MatchPlayer = {
  user_id: string;
  team: number;
  position: Position;
  confirmed_attendance: boolean;
  profiles: { name: string | null; level: number } | null;
};

type Slot = { team: 1 | 2; position: Position };

const POSITION_LABEL: Record<Position, string> = {
  derecha: "Derecha",
  reves: "Revés",
};

// Equipo 1 mira hacia la red; Equipo 2 la mira desde el lado opuesto, así
// que su derecha/revés queda en espejo respecto al Equipo 1.
const TEAM_COLUMNS: Record<1 | 2, Position[]> = {
  1: ["derecha", "reves"],
  2: ["reves", "derecha"],
};

const initialState: MatchActionState = {};

export function MatchActions({
  matchId,
  team1,
  team2,
  registration,
  joinBlockedReason,
  initialTeam,
  initialPosition,
}: {
  matchId: string;
  team1: MatchPlayer[];
  team2: MatchPlayer[];
  registration: { team: number; confirmedAttendance: boolean } | null;
  joinBlockedReason: string | null;
  initialTeam: 1 | 2 | null;
  initialPosition: Position | null;
}) {
  const [joinState, joinAction, joinPending] = useActionState(
    joinMatch.bind(null, matchId),
    initialState,
  );
  const [leaveState, leaveAction, leavePending] = useActionState(
    leaveMatch.bind(null, matchId),
    initialState,
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmAttendance.bind(null, matchId),
    initialState,
  );

  const canJoin = !registration && !joinBlockedReason;

  const isFree = (team: 1 | 2, position: Position) =>
    !(team === 1 ? team1 : team2).some((p) => p.position === position);

  const [selected, setSelected] = useState<Slot | null>(() => {
    if (initialTeam && initialPosition && isFree(initialTeam, initialPosition)) {
      return { team: initialTeam, position: initialPosition };
    }
    return null;
  });

  const selectedIsStillFree = useMemo(
    () => (selected ? isFree(selected.team, selected.position) : true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, team1, team2],
  );
  const effectiveSelected = selectedIsStillFree ? selected : null;

  return (
    <div className="space-y-3">
      <Court
        team1={team1}
        team2={team2}
        selectable={canJoin}
        selected={effectiveSelected}
        onSelect={setSelected}
      />

      {registration && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Estás inscrito en el equipo {registration.team}.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {registration.confirmedAttendance ? (
              <span className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-300">
                Asistencia confirmada ✅
              </span>
            ) : (
              <form action={confirmAction} className="flex-1">
                <Button
                  type="submit"
                  disabled={confirmPending}
                  className="w-full"
                >
                  {confirmPending ? "Confirmando…" : "Confirmar asistencia"}
                </Button>
              </form>
            )}
            <form action={leaveAction} className="flex-1">
              <Button
                type="submit"
                variant="danger"
                disabled={leavePending}
                className="w-full"
              >
                {leavePending ? "Saliendo…" : "Salirse del partido"}
              </Button>
            </form>
          </div>
          {(leaveState.error || confirmState.error) && (
            <p className="text-sm text-red-400">
              {leaveState.error ?? confirmState.error}
            </p>
          )}
        </div>
      )}

      {joinBlockedReason && !registration && (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
          {joinBlockedReason}
        </p>
      )}

      {canJoin && (
        <form action={joinAction} className="space-y-3">
          <input type="hidden" name="team" value={effectiveSelected?.team ?? ""} />
          <input
            type="hidden"
            name="position"
            value={effectiveSelected?.position ?? ""}
          />
          <p className="text-sm text-muted-foreground">
            {effectiveSelected
              ? `Seleccionado: Equipo ${effectiveSelected.team} · ${POSITION_LABEL[effectiveSelected.position]}`
              : "Toca un hueco libre de la pista para elegir tu equipo y posición."}
          </p>
          <Button
            type="submit"
            disabled={joinPending || !effectiveSelected}
            className="w-full"
          >
            {joinPending ? "Uniéndote…" : "Unirse al partido"}
          </Button>
          {joinState.error && (
            <p className="text-sm text-red-400">{joinState.error}</p>
          )}
        </form>
      )}
    </div>
  );
}

function Court({
  team1,
  team2,
  selectable,
  selected,
  onSelect,
}: {
  team1: MatchPlayer[];
  team2: MatchPlayer[];
  selectable: boolean;
  selected: Slot | null;
  onSelect: (slot: Slot) => void;
}) {
  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 via-transparent to-emerald-500/10 p-4">
      <TeamRow
        title="Equipo 1"
        team={1}
        players={team1}
        selectable={selectable}
        selected={selected}
        onSelect={onSelect}
      />

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
          RED
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <TeamRow
        title="Equipo 2"
        team={2}
        players={team2}
        selectable={selectable}
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  );
}

function TeamRow({
  title,
  team,
  players,
  selectable,
  selected,
  onSelect,
}: {
  title: string;
  team: 1 | 2;
  players: MatchPlayer[];
  selectable: boolean;
  selected: Slot | null;
  onSelect: (slot: Slot) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {TEAM_COLUMNS[team].map((position) => {
          const player = players.find((p) => p.position === position);
          if (player) {
            return <PlayerCard key={position} player={player} />;
          }
          return (
            <EmptySlotCard
              key={position}
              position={position}
              selectable={selectable}
              isSelected={
                selected?.team === team && selected.position === position
              }
              onClick={() => onSelect({ team, position })}
            />
          );
        })}
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
      <p className="text-[11px] font-medium text-muted-foreground">
        {POSITION_LABEL[player.position]}
      </p>
      {player.confirmed_attendance && (
        <span className="text-[11px] font-medium text-emerald-400">
          ✓ Confirmado
        </span>
      )}
    </div>
  );
}

function EmptySlotCard({
  position,
  selectable,
  isSelected,
  onClick,
}: {
  position: Position;
  selectable: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  if (!selectable) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-3 text-center text-muted-foreground">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-border text-lg leading-none">
          +
        </span>
        <p className="text-xs">Hueco libre ({POSITION_LABEL[position]})</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-3 text-center transition-colors ${
        isSelected
          ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
          : "border-border text-muted-foreground hover:border-emerald-400/60 hover:text-emerald-300/80"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-current text-lg leading-none">
        {isSelected ? "✓" : "+"}
      </span>
      <p className="text-xs">{POSITION_LABEL[position]}</p>
    </button>
  );
}
