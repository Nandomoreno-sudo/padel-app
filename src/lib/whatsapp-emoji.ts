// Unicode code-point escapes instead of literal glyphs: the escape sequence
// is plain ASCII, so it survives regardless of the source file's on-disk
// encoding and can't be mangled into mojibake by an editor/tool that
// mishandles multi-byte UTF-8 (the corrupted "" symbols reported in
// WhatsApp messages). Combine with encodeURIComponent() on the full
// message before it's appended to the wa.me URL.
export const WHATSAPP_EMOJI = {
  tennis: "\u{1F3BE}", // 🎾
  pin: "\u{1F4CD}", // 📍
  calendar: "\u{1F4C5}", // 📅
  link: "\u{1F517}", // 🔗
  megaphone: "\u{1F4E2}", // 📢
  greenCircle: "\u{1F7E2}", // 🟢
  info: "\u{2139}\u{FE0F}", // ℹ️
  chart: "\u{1F4CA}", // 📊
} as const;
