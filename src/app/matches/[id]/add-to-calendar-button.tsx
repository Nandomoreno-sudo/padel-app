"use client";

import { useEffect, useRef, useState } from "react";

function toCompactUtc(date: Date): string {
  // YYYYMMDDTHHMMSSZ — the format both Google Calendar's template URL and
  // the ICS DTSTART/DTEND/DTSTAMP fields expect.
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function AddToCalendarButton({
  title,
  location,
  startTime,
  durationMinutes,
  playerNames,
}: {
  title: string;
  location: string;
  startTime: string;
  durationMinutes: number;
  playerNames: string[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const description =
    playerNames.length > 0
      ? `Jugadores: ${playerNames.join(", ")}`
      : "Partido de pádel";

  function handleGoogleCalendar() {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${toCompactUtc(start)}/${toCompactUtc(end)}`,
      details: description,
      location,
    });
    window.open(
      `https://calendar.google.com/calendar/render?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

  function handleDownloadIcs() {
    const uid = `${crypto.randomUUID()}@padel-app`;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Padel Club App//ES",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${toCompactUtc(new Date())}`,
      `DTSTART:${toCompactUtc(start)}`,
      `DTEND:${toCompactUtc(end)}`,
      `SUMMARY:${escapeIcsText(title)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `LOCATION:${escapeIcsText(location)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "partido-padel.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/15 active:bg-emerald-500/15"
      >
        📅 Añadir al calendario
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <button
            type="button"
            onClick={handleGoogleCalendar}
            className="flex min-h-12 w-full items-center px-4 text-sm hover:bg-surface-hover active:bg-surface-hover"
          >
            Google Calendar
          </button>
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="flex min-h-12 w-full items-center border-t border-border px-4 text-sm hover:bg-surface-hover active:bg-surface-hover"
          >
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
