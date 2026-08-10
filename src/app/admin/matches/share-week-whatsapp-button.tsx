"use client";

import { WHATSAPP_EMOJI } from "@/lib/whatsapp-emoji";

// NEXT_PUBLIC_APP_URL lets you pin the link to a canonical public domain;
// falls back to window.location.origin. Same approach as the other
// WhatsApp share buttons in the app.
function getShareOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
}

export function ShareWeekWhatsAppButton({
  matches,
}: {
  matches: { id: string; court_name: string; start_time: string }[];
}) {
  function handleClick() {
    const origin = getShareOrigin();
    const entries = matches.map((match) => {
      const date = new Date(match.start_time);
      const formattedDate = date.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      });
      const formattedTime = date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return [
        `${WHATSAPP_EMOJI.calendar} ${formattedDate} - ${formattedTime} | ${WHATSAPP_EMOJI.pin} ${match.court_name}`,
        `${WHATSAPP_EMOJI.link} ${origin}/matches/${match.id}`,
      ].join("\n");
    });

    const message = [
      `${WHATSAPP_EMOJI.tennis} PARTIDOS DE LA SEMANA`,
      "",
      entries.join("\n\n"),
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay partidos próximos esta semana para compartir.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white hover:opacity-90 active:opacity-90"
    >
      📣 Compartir partidos de la semana
    </button>
  );
}
