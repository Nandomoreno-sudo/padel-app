// Unicode code-point escapes instead of literal glyphs: the escape sequence
// is plain ASCII, so it survives regardless of the source file's on-disk
// encoding and can't be mangled into mojibake. Combine with
// encodeURIComponent() on the full message before it's appended to the
// wa.me URL.
export const WHATSAPP_EMOJI = {
  tennis: "\u{1F3BE}", // 🎾
  calendar: "\u{1F4C5}", // 📅
  pin: "\u{1F4CD}", // 📍
  chart: "\u{1F4CA}", // 📊
} as const;
