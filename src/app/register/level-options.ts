// Self-declared level options shown at sign-up, mapped onto the same 1-7
// scale used by src/lib/level-calculator.ts (MIN_LEVEL=1, MAX_LEVEL=7).
// Centered on 2.5 (the profiles.level column default, used as the fallback
// when no option was picked) and spaced a full point apart so a new
// player starts close to their real level instead of always at 2.5 and
// waiting out the calculator's 0.4-per-match cap to get there.
export const LEVEL_OPTIONS = [
  { value: "1.5", label: "Principiante" },
  { value: "2.5", label: "Intermedio" },
  { value: "3.5", label: "Avanzado" },
  { value: "4.5", label: "Avanzado+" },
] as const;
