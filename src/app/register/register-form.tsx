"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { register, type RegisterActionState } from "./actions";

const initialState: RegisterActionState = {};

export function RegisterForm({ invitationCode }: { invitationCode: string }) {
  const [state, formAction, pending] = useActionState(
    register,
    initialState,
  );

  return (
    <div className="w-full max-w-sm space-y-6">
      <form action={formAction} className="space-y-4">
        <Field
          label="Código de invitación"
          name="invitationCode"
          type="text"
          autoComplete="off"
          defaultValue={invitationCode}
        />
        <Field label="Nombre" name="name" type="text" autoComplete="name" />
        <Field
          label="Teléfono (opcional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          required={false}
        />
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.message && (
        <p className="text-sm text-emerald-400">{state.message}</p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-emerald-400">
          Inicia sesión
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
  required = true,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  required?: boolean;
  defaultValue?: string;
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
        required={required}
        defaultValue={defaultValue}
        className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-emerald-500"
      />
    </div>
  );
}
