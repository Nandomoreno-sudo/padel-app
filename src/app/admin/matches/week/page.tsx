import { requireAdmin } from "@/lib/supabase/dal";
import { WeekMatchForm, type WeekMatchRow } from "./week-match-form";

// Mirrors the local-time interpretation that parseMatchFields (actions.ts)
// applies when it re-parses `${date}T${time}` on submit, so a row that
// isn't touched round-trips to the same start_time it was seeded from.
function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTimeInputValue(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

export default async function NewWeekMatchesPage() {
  const { supabase } = await requireAdmin();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: lastWeekMatches } = await supabase
    .from("matches")
    .select("court_name, start_time, duration_minutes, min_level, max_level")
    .neq("status", "cancelled")
    .gte("start_time", weekAgo.toISOString())
    .lt("start_time", now.toISOString())
    .order("start_time", { ascending: true });

  const initialRows: WeekMatchRow[] = (lastWeekMatches ?? []).map((match) => {
    const shifted = new Date(match.start_time);
    shifted.setDate(shifted.getDate() + 7);
    return {
      id: crypto.randomUUID(),
      date: toDateInputValue(shifted),
      time: toTimeInputValue(shifted),
      courtName: match.court_name,
      duration: match.duration_minutes,
      minLevel: match.min_level !== null ? String(match.min_level) : "",
      maxLevel: match.max_level !== null ? String(match.max_level) : "",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crear semana</h1>
        <p className="text-sm text-muted-foreground">
          Propuesta a partir de los partidos de los últimos 7 días, con la
          fecha desplazada una semana. Revisa, edita o quita filas, añade
          alguna nueva si hace falta, y confirma para crearlos todos a la
          vez.
        </p>
      </div>
      <WeekMatchForm initialRows={initialRows} />
    </div>
  );
}
