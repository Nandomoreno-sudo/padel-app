// Normalizes a Spanish phone number for storage and for building wa.me
// links: strips spaces, dashes and "+", then prefixes a bare 9-digit mobile
// number (starting 6, 7 or 8) with the "34" country code. A number that
// already carries the "34" prefix, or doesn't match the mobile pattern at
// all (landlines, foreign numbers), is returned as-is once cleaned.
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-+]/g, "");

  if (/^[678]\d{8}$/.test(cleaned)) {
    return `34${cleaned}`;
  }

  return cleaned;
}
