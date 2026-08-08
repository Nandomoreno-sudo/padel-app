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
    <form action={formAction} className="space-y-2">
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Generando…" : "Generar invitación"}
      </Button>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
