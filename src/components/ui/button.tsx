import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 active:bg-emerald-400",
  secondary:
    "border border-border text-foreground hover:bg-surface-hover active:bg-surface-hover",
  danger:
    "border border-red-500/30 text-red-400 hover:bg-red-500/10 active:bg-red-500/10",
};

// min-h-12 (48px) keeps every button comfortably tappable with a thumb.
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
