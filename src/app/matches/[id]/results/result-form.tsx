"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { submitResult, type ResultActionState } from "./actions";

const initialState: ResultActionState = {};

export function ResultForm({ matchId }: { matchId: string }) {
  const [state, formAction, pending] = useActionState(
    submitResult.bind(null, matchId),
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-surface p-4"
    >
      <h2 className="font-semibold">Introducir resultado</h2>
      <SetInputs label="Set 1" prefix="set1" />
      <SetInputs label="Set 2" prefix="set2" />
      <SetInputs label="Set 3 (opcional)" prefix="set3" />

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando…" : "Enviar resultado"}
      </Button>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}

function SetInputs({ label, prefix }: { label: string; prefix: string }) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-3">
        <input
          type="number"
          name={`${prefix}Team1`}
          min={0}
          placeholder="Equipo 1"
          aria-label={`${label} - juegos equipo 1`}
          className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-emerald-500"
        />
        <span className="text-muted-foreground">-</span>
        <input
          type="number"
          name={`${prefix}Team2`}
          min={0}
          placeholder="Equipo 2"
          aria-label={`${label} - juegos equipo 2`}
          className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-emerald-500"
        />
      </div>
    </fieldset>
  );
}
