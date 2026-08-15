import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/dal";
import { getMadridDayStart } from "@/lib/madrid-time";

type ResultRow = {
  match_id: string;
  set1_team1: number | null;
  set1_team2: number | null;
  set2_team1: number | null;
  set2_team2: number | null;
  set3_team1: number | null;
  set3_team2: number | null;
};

export default async function AdminMatchesHistoryPage() {
  const { supabase } = await requireAdmin();

  const todayStart = getMadridDayStart();

  // 'finished' only happens once approve_match_result has run (see
  // 04_match_results_workflow.sql), which requires a match_results row to
  // exist first — so this status alone already implies a confirmed result.
  // Matches left open/full/pending_result/cancelled in the past are
  // excluded, matching the "solo partidos completados con resultado" rule.
  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, court_name, start_time, duration_minutes, min_level, max_level",
    )
    .eq("status", "finished")
    .lt("start_time", todayStart.toISOString())
    .order("start_time", { ascending: false });

  const matchIds = (matches ?? []).map((match) => match.id);

  const { data: results } =
    matchIds.length > 0
      ? await supabase
          .from("match_results")
          .select(
            "match_id, set1_team1, set1_team2, set2_team1, set2_team2, set3_team1, set3_team2",
          )
          .in("match_id", matchIds)
      : { data: [] };

  const resultByMatch = new Map<string, ResultRow>();
  for (const result of (results ?? []) as ResultRow[]) {
    resultByMatch.set(result.match_id, result);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin/matches"
          className="text-sm font-medium text-emerald-400"
        >
          ← Volver a partidos
        </Link>
        <h1 className="text-2xl font-bold">Historial de partidos</h1>
        <p className="text-sm text-muted-foreground">
          Partidos pasados con resultado confirmado.
        </p>
      </div>

      <div className="space-y-4">
        {(matches ?? []).map((match) => {
          const start = new Date(match.start_time);
          const result = resultByMatch.get(match.id);
          const sets = result
            ? [
                [result.set1_team1, result.set1_team2],
                [result.set2_team1, result.set2_team2],
                [result.set3_team1, result.set3_team2],
              ].filter(
                ([a, b]) => a !== null && b !== null,
              ) as [number, number][]
            : [];

          return (
            <div
              key={match.id}
              className="space-y-3 rounded-2xl border border-border bg-surface p-4"
            >
              <div>
                <p className="font-semibold">
                  {start.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  ·{" "}
                  {start.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {match.court_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {match.duration_minutes} min · Nivel{" "}
                  {match.min_level !== null && match.max_level !== null
                    ? `${match.min_level} - ${match.max_level}`
                    : "todos"}
                </p>
              </div>

              {sets.length > 0 && (
                <div className="flex gap-6">
                  {sets.map(([team1, team2], index) => (
                    <div key={index} className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Set {index + 1}
                      </p>
                      <p className="font-mono text-lg font-semibold">
                        {team1}-{team2}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {(matches ?? []).length === 0 && (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            Todavía no hay partidos con resultado confirmado.
          </p>
        )}
      </div>
    </div>
  );
}
