export function LevelBadge({ level }: { level: number | null | undefined }) {
  if (level === null || level === undefined) {
    return (
      <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
        Sin nivel
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
      Nivel {level.toFixed(1)}
    </span>
  );
}
