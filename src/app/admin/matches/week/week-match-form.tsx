"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createMatchesBatch,
  type CreateMatchesBatchState,
} from "../actions";

const initialState: CreateMatchesBatchState = {};

const COURT_NUMBERS = Array.from({ length: 10 }, (_, i) => i + 1);

export type WeekMatchRow = {
  id: string;
  date: string;
  time: string;
  courtName: string;
  duration: number;
  minLevel: string;
  maxLevel: string;
};

const inputClass =
  "min-h-12 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-emerald-500";

function emptyRow(): WeekMatchRow {
  return {
    id: crypto.randomUUID(),
    date: "",
    time: "",
    courtName: "",
    duration: 90,
    minLevel: "",
    maxLevel: "",
  };
}

export function WeekMatchForm({
  initialRows,
}: {
  initialRows: WeekMatchRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [state, formAction, pending] = useActionState(
    createMatchesBatch,
    initialState,
  );

  function updateRow(id: string, patch: Partial<WeekMatchRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-3 lg:grid-cols-6"
          >
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Fecha
              </label>
              <input
                type="date"
                required
                value={row.date}
                onChange={(e) => updateRow(row.id, { date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Hora
              </label>
              <input
                type="time"
                required
                value={row.time}
                onChange={(e) => updateRow(row.id, { time: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Pista
              </label>
              <select
                required
                value={row.courtName}
                onChange={(e) =>
                  updateRow(row.id, { courtName: e.target.value })
                }
                className={inputClass}
              >
                <option value="" disabled>
                  Selecciona
                </option>
                {COURT_NUMBERS.map((n) => (
                  <option key={n} value={`Pista ${n}`}>
                    Pista {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Duración (min)
              </label>
              <input
                type="number"
                min={30}
                step={15}
                required
                value={row.duration}
                onChange={(e) =>
                  updateRow(row.id, { duration: Number(e.target.value) })
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Nivel mín.
              </label>
              <input
                type="number"
                min={1}
                max={7}
                step={0.5}
                value={row.minLevel}
                onChange={(e) =>
                  updateRow(row.id, { minLevel: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Nivel máx.
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  step={0.5}
                  value={row.maxLevel}
                  onChange={(e) =>
                    updateRow(row.id, { maxLevel: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => removeRow(row.id)}
                className="px-3"
              >
                Quitar
              </Button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            No hay partidos propuestos. Añade alguno con el botón de abajo.
          </p>
        )}
      </div>

      <Button type="button" variant="secondary" onClick={addRow}>
        + Añadir partido
      </Button>

      <Button
        type="submit"
        disabled={pending || rows.length === 0}
        className="w-full"
      >
        {pending
          ? "Creando…"
          : `Crear ${rows.length} partido${rows.length === 1 ? "" : "s"}`}
      </Button>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
