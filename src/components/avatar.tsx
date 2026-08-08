const PALETTE = [
  "bg-emerald-500/15 text-emerald-300",
  "bg-sky-500/15 text-sky-300",
  "bg-amber-500/15 text-amber-300",
  "bg-fuchsia-500/15 text-fuchsia-300",
  "bg-rose-500/15 text-rose-300",
  "bg-violet-500/15 text-violet-300",
];

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  // Match letter-only words so parenthetical notes/punctuation (e.g.
  // "Carlos (Prueba)") don't leak stray characters into the initials.
  const words = name.match(/\p{L}+/gu) ?? [];
  const initials = words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

function paletteFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({
  name,
  seed,
  size = "md",
}: {
  name: string | null | undefined;
  seed?: string;
  size?: keyof typeof SIZE_CLASSES;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${paletteFor(seed ?? name ?? "?")} ${SIZE_CLASSES[size]}`}
    >
      {getInitials(name)}
    </span>
  );
}
