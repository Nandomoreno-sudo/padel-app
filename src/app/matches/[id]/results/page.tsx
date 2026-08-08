import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchStatusBadge } from "@/components/match-badges";
import { ResultForm } from "./result-form";
import { PendingResultReview } from "./pending-result-review";

type ResultRow = {
  set1_team1: number | null;
  set1_team2: number | null;
  set2_team1: number | null;
  set2_team2: number | null;
  set3_team1: number | null;
  set3_team2: number | null;
  confirmed_by_admin: boolean;
  submitted_by: string | null;
};

export default async function MatchResultsPage(
  props: PageProps<"/matches/[id]/results">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: match }, { data: profile }, { data: players }, { data: result }] =
    await Promise.all([
      supabase
        .from("matches")
        .select("id, court_name, start_time, status")
        .eq("id", id)
        .single(),
      supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
      supabase
        .from("match_players")
        .select("user_id, team, profiles(name)")
        .eq("match_id", id),
      supabase
        .from("match_results")
        .select(
          "set1_team1, set1_team2, set2_team1, set2_team2, set3_team1, set3_team2, confirmed_by_admin, submitted_by",
        )
        .eq("match_id", id)
        .maybeSingle(),
    ]);

  if (!match) {
    notFound();
  }

  const playerList = players ?? [];
  const isParticipant = playerList.some((p) => p.user_id === user.id);
  const isAdmin = Boolean(profile?.is_admin);
  const resultRow = result as ResultRow | null;

  const canSubmit =
    (isParticipant || isAdmin) && match.status === "full" && !resultRow;

  const isSubmitter = resultRow?.submitted_by === user.id;
  const canReview =
    Boolean(resultRow) &&
    match.status === "pending_result" &&
    (isAdmin || (isParticipant && !isSubmitter));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6 pb-8">
      <div className="space-y-2">
        <Link
          href={`/matches/${id}`}
          className="text-sm font-medium text-emerald-400"
        >
          ← Volver al partido
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{match.court_name}</h1>
          <MatchStatusBadge status={match.status} />
        </div>
      </div>

      {resultRow && (
        <ResultSummary
          result={resultRow}
          title={
            match.status === "finished"
              ? "Resultado final"
              : "Resultado propuesto"
          }
        />
      )}

      {match.status === "pending_result" && resultRow && (
        <div className="space-y-3">
          {canReview ? (
            <PendingResultReview matchId={id} isAdmin={isAdmin} />
          ) : isSubmitter ? (
            <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
              Esperando a que otro jugador del partido, o un admin, apruebe
              el resultado.
            </p>
          ) : (
            <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
              Solo un jugador del partido (distinto de quien lo envió) o un
              admin puede aprobarlo o impugnarlo.
            </p>
          )}
        </div>
      )}

      {canSubmit && <ResultForm matchId={id} />}

      {!canSubmit && match.status === "full" && !resultRow && (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
          Solo un jugador inscrito en este partido puede introducir el
          resultado.
        </p>
      )}

      {match.status === "open" && !resultRow && (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
          El resultado se podrá introducir cuando el partido tenga sus 4
          jugadores inscritos.
        </p>
      )}

      {match.status === "cancelled" && (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
          Este partido está cancelado.
        </p>
      )}
    </main>
  );
}

function ResultSummary({
  result,
  title,
}: {
  result: ResultRow;
  title: string;
}) {
  const sets = [
    [result.set1_team1, result.set1_team2],
    [result.set2_team1, result.set2_team2],
    [result.set3_team1, result.set3_team2],
  ].filter(([a, b]) => a !== null && b !== null) as [number, number][];

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {result.confirmed_by_admin && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
            Confirmado por un admin
          </span>
        )}
      </div>
      <div className="flex gap-6">
        {sets.map(([team1, team2], index) => (
          <div key={index} className="text-center">
            <p className="text-xs text-muted-foreground">Set {index + 1}</p>
            <p className="font-mono text-lg font-semibold">
              {team1}-{team2}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
