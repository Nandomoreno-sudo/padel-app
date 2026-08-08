"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createMatch, type CreateMatchState } from "../actions";

const initialState: CreateMatchState = {};

export function MatchForm() {
  const [state, formAction, pending] = useActionState(
    createMatch,
    initialState,
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha" name="date" type="date" />
        <Field label="Hora" name="time" type="time" />
      </div>
      <Field label="Pista / club" name="courtName" type="text" />
      <Field
        label="Duración (min)"
        name="duration"
        type="number"
        min={30}
        step={15}
        defaultValue="90"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Nivel mínimo"
          name="minLevel"
          type="number"
          min={1}
          max={7}
          step={0.5}
          required={false}
        />
        <Field
          label="Nivel máximo"
          name="maxLevel"
          type="number"
          min={1}
          max={7}
          step={0.5}
          required={false}
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando…" : "Crear partido"}
      </Button>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required = true,
  defaultValue,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-emerald-500"
      />
    </div>
  );
}
