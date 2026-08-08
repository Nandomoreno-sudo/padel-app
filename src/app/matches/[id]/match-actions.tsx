"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  joinMatch,
  leaveMatch,
  confirmAttendance,
  type MatchActionState,
} from "./actions";

const initialState: MatchActionState = {};

export function MatchActions({
  matchId,
  registration,
  team1Full,
  team2Full,
  joinBlockedReason,
}: {
  matchId: string;
  registration: { team: number; confirmedAttendance: boolean } | null;
  team1Full: boolean;
  team2Full: boolean;
  joinBlockedReason: string | null;
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

  if (registration) {
    return (
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
    );
  }

  if (joinBlockedReason) {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        {joinBlockedReason}
      </p>
    );
  }

  return (
    <form action={joinAction} className="space-y-3">
      <fieldset className="flex gap-3">
        <TeamOption value="1" defaultChecked={!team1Full} disabled={team1Full}>
          Equipo 1
        </TeamOption>
        <TeamOption
          value="2"
          defaultChecked={team1Full && !team2Full}
          disabled={team2Full}
        >
          Equipo 2
        </TeamOption>
      </fieldset>
      <Button
        type="submit"
        disabled={joinPending || (team1Full && team2Full)}
        className="w-full"
      >
        {joinPending ? "Uniéndote…" : "Unirse al partido"}
      </Button>
      {joinState.error && (
        <p className="text-sm text-red-400">{joinState.error}</p>
      )}
    </form>
  );
}

function TeamOption({
  value,
  defaultChecked,
  disabled,
  children,
}: {
  value: string;
  defaultChecked: boolean;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:checked]:text-emerald-300 has-[:disabled]:opacity-40">
      <input
        type="radio"
        name="team"
        value={value}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="sr-only"
      />
      {children}
    </label>
  );
}
