"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  label,
  copiedLabel = "¡Copiado!",
  className = "",
}: {
  text: string;
  label: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context); nothing to do.
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleClick}
      className={className}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
