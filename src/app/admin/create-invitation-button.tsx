"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createInvitation, type CreateInvitationState } from "./actions";

const initialState: CreateInvitationState = {};

export function CreateInvitationButton() {
  const [state, formAction, pending] = useActionState(
    createInvitation,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="max-w-xs space-y-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Teléfono (opcional)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Ej: 34612345678"
          className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-emerald-500"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Generando…" : "Generar invitación"}
      </Button>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
