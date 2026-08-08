"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  signInWithPassword,
  signInWithMagicLink,
  type LoginActionState,
} from "./actions";

const initialState: LoginActionState = {};

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const [magicLinkState, magicLinkAction, magicLinkPending] = useActionState(
    signInWithMagicLink,
    initialState,
  );

  const state = mode === "password" ? passwordState : magicLinkState;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex rounded-xl border border-border bg-surface p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`min-h-11 flex-1 rounded-lg font-medium transition-colors ${
            mode === "password"
              ? "bg-emerald-500 text-emerald-950"
              : "text-muted-foreground"
          }`}
        >
          Email y contraseña
        </button>
        <button
          type="button"
          onClick={() => setMode("magic-link")}
          className={`min-h-11 flex-1 rounded-lg font-medium transition-colors ${
            mode === "magic-link"
              ? "bg-emerald-500 text-emerald-950"
              : "text-muted-foreground"
          }`}
        >
          Enlace mágico
        </button>
      </div>

      {mode === "password" ? (
        <form action={passwordAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email" name="email" type="email" autoComplete="email" />
          <Field
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
          />
          <Button type="submit" disabled={passwordPending} className="w-full">
            {passwordPending ? "Enviando…" : "Entrar"}
          </Button>
        </form>
      ) : (
        <form action={magicLinkAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email" name="email" type="email" autoComplete="email" />
          <Button
            type="submit"
            disabled={magicLinkPending}
            className="w-full"
          >
            {magicLinkPending ? "Enviando…" : "Enviar enlace mágico"}
          </Button>
        </form>
      )}

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.message && (
        <p className="text-sm text-emerald-400">{state.message}</p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-emerald-400">
          Regístrate con un código de invitación
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-emerald-500"
      />
    </div>
  );
}
