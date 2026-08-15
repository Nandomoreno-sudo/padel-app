// Server processes (Vercel functions included) run in UTC by default, so
// `new Date(now.getFullYear(), now.getMonth(), now.getDate())` computes
// midnight in the server's timezone, not the club's. That drifts from
// Europe/Madrid whenever they disagree on the current calendar day (e.g.
// the first two hours after Madrid midnight are still the previous day in
// UTC), which silently reintroduces "past" matches into "today" queries.
// This reads the wall-clock date and UTC offset Europe/Madrid actually has
// right now (correctly following the CET/CEST DST switch) and returns the
// UTC instant for that day's midnight there.
export function getMadridDayStart(now: Date = new Date()): Date {
  const madridYMD = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const offsetName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    timeZoneName: "shortOffset",
  })
    .formatToParts(now)
    .find((part) => part.type === "timeZoneName")?.value;

  const offsetHours = Number(offsetName?.replace("GMT", "") || "1");
  const sign = offsetHours >= 0 ? "+" : "-";
  const offset = `${sign}${String(Math.abs(offsetHours)).padStart(2, "0")}:00`;

  return new Date(`${madridYMD}T00:00:00${offset}`);
}
