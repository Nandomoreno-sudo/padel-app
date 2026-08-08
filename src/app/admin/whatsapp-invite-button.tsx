"use client";

// NEXT_PUBLIC_APP_URL lets you pin the link to a canonical public domain;
// falls back to window.location.origin (localhost in dev, the real domain
// once deployed). Same approach as the match-sharing WhatsApp button.
function getShareOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
}

export function WhatsAppInviteButton({
  code,
  phone,
}: {
  code: string;
  phone: string | null;
}) {
  function handleClick() {
    const link = `${getShareOrigin()}/register?code=${code}`;
    const message = `¡Hola! Aquí tienes tu invitación exclusiva para unirte a la app de pádel del club: ${link}. ¡Regístrate para reservar tu plaza en el próximo partido!`;

    // wa.me needs digits only (country code + number, no "+", spaces or
    // dashes). If no phone was captured, omit the number entirely so
    // WhatsApp opens its own contact picker instead.
    const digitsOnly = phone?.replace(/\D/g, "") ?? "";
    const base = digitsOnly
      ? `https://wa.me/${digitsOnly}`
      : "https://wa.me/";

    window.open(
      `${base}?text=${encodeURIComponent(message)}`,
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
      Enviar por WhatsApp
    </button>
  );
}
