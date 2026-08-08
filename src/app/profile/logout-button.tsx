"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      className="w-full"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
    >
      {pending ? "Cerrando sesión…" : "Cerrar sesión"}
    </Button>
  );
}
