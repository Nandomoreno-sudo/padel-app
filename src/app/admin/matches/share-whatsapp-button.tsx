"use client";

import { WHATSAPP_EMOJI } from "@/lib/whatsapp-emoji";

// NEXT_PUBLIC_APP_URL lets you pin the link to a canonical public domain
// (useful behind proxies/CDNs where the browser's origin may not be the
// public one). Falls back to window.location.origin, which already tracks
// whatever domain the app is actually served from — localhost in dev, the
// real domain once deployed — so nothing needs to change between them.
function getShareOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
}

export function ShareWhatsAppButton({
  matchId,
  courtName,
  startTime,
  minLevel,
  maxLevel,
}: {
  matchId: string;
  courtName: string;
  startTime: string;
  minLevel: number | null;
  maxLevel: number | null;
}) {
  function buildMessage() {
    const date = new Date(startTime);
    const formattedDate = date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const levelRange =
      minLevel !== null && maxLevel !== null
        ? `${minLevel} - ${maxLevel}`
        : "Todos los niveles";
    const matchUrl = `${getShareOrigin()}/matches/${matchId}`;

    return [
      `${WHATSAPP_EMOJI.tennis} NUEVO PARTIDO DISPONIBLE`,
      `${WHATSAPP_EMOJI.calendar} ${formattedDate} - ${formattedTime} | ${WHATSAPP_EMOJI.pin} ${courtName}`,
      `${WHATSAPP_EMOJI.chart} Nivel: ${levelRange}`,
      `${WHATSAPP_EMOJI.link} Apúntate aquí: ${matchUrl}`,
    ].join("\n");
  }

  async function handleClick() {
    const message = buildMessage();
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Clipboard API unavailable (e.g. insecure context); WhatsApp still
      // opens below with the message pre-filled.
    }
    // encodeURIComponent must wrap the *entire* raw message exactly once —
    // it correctly percent-encodes the UTF-8 bytes of the emoji (multi-byte
    // characters), so they render as clean emoji rather than mojibake in
    // WhatsApp. Encoding substrings separately or re-encoding here would
    // corrupt them.
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
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white hover:opacity-90 active:opacity-90 sm:w-auto"
    >
      Compartir en WhatsApp
    </button>
  );
}
