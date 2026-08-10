"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteMatch, type MatchActionState } from "./actions";

const initialState: MatchActionState = {};

export function DeleteMatchButton({ matchId }: { matchId: string }) {
  const [state, formAction, pending] = useActionState(
    deleteMatch.bind(null, matchId),
    initialState,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "¿Seguro que quieres eliminar este partido? Esta acción no se puede deshacer.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <Button
        type="submit"
        variant="danger"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Eliminando…" : "🗑️ Eliminar partido"}
      </Button>
      {state.error && (
        <p className="mt-2 text-sm text-red-400">{state.error}</p>
      )}
    </form>
  );
}
