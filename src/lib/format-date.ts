// Intl formats es-ES weekdays/months lowercase and joins them with a
// comma (e.g. "lunes, 10 de agosto"); we drop the comma and capitalize
// the leading weekday to read as "Lunes 10 de agosto".
export function formatMatchDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const formatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(value)
    .replace(",", "");

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
