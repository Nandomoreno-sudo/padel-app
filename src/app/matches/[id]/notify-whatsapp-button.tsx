"use client";

import { MATCH_STATUS_LABELS } from "@/components/match-badges";
import { WHATSAPP_EMOJI } from "@/lib/whatsapp-emoji";

// NEXT_PUBLIC_APP_URL lets you pin the link to a canonical public domain;
// falls back to window.location.origin. Same approach as the other
// WhatsApp share buttons in the app.
function getShareOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
}

const MAX_SLOTS = 4;

export function NotifyWhatsAppButton({
  matchId,
  courtName,
  startTime,
  playerCount,
  status,
}: {
  matchId: string;
  courtName: string;
  startTime: string;
  playerCount: number;
  status: string;
}) {
  function handleClick() {
    const date = new Date(startTime);
    const formattedDate = date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
    const formattedTime = date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const statusLine =
      status === "open" || status === "full"
        ? `${WHATSAPP_EMOJI.greenCircle} Plazas libres: ${Math.max(0, MAX_SLOTS - playerCount)}/${MAX_SLOTS}`
        : `${WHATSAPP_EMOJI.info} Estado: ${MATCH_STATUS_LABELS[status] ?? status}`;

    const matchUrl = `${getShareOrigin()}/matches/${matchId}`;

    const message = [
      `${WHATSAPP_EMOJI.megaphone} Actualización del partido de pádel`,
      `${WHATSAPP_EMOJI.calendar} ${formattedDate} - ${formattedTime} | ${WHATSAPP_EMOJI.pin} ${courtName}`,
      statusLine,
      `${WHATSAPP_EMOJI.link} Ver detalles: ${matchUrl}`,
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white hover:opacity-90 active:opacity-90"
    >
      📣 Avisar por WhatsApp
    </button>
  );
}
