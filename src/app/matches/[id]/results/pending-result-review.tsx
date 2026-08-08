"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  approveResult,
  disputeResult,
  type ResultActionState,
} from "./actions";

const initialState: ResultActionState = {};

export function PendingResultReview({
  matchId,
  isAdmin,
}: {
  matchId: string;
  isAdmin: boolean;
}) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveResult.bind(null, matchId),
    initialState,
  );
  const [disputeState, disputeAction, disputePending] = useActionState(
    disputeResult.bind(null, matchId),
    initialState,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form action={approveAction} className="flex-1">
          <Button type="submit" disabled={approvePending} className="w-full">
            {approvePending
              ? "Aprobando…"
              : isAdmin
                ? "Confirmar resultado (admin)"
                : "Aprobar resultado"}
          </Button>
        </form>
        <form action={disputeAction} className="flex-1">
          <Button
            type="submit"
            variant="danger"
            disabled={disputePending}
            className="w-full"
          >
            {disputePending ? "Impugnando…" : "Impugnar"}
          </Button>
        </form>
      </div>
      {(approveState.error || disputeState.error) && (
        <p className="text-sm text-red-400">
          {approveState.error ?? disputeState.error}
        </p>
      )}
    </div>
  );
}
