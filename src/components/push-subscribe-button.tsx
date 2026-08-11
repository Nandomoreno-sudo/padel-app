"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { subscribeToPush } from "@/app/notifications/push-actions";
import { urlBase64ToUint8Array } from "@/lib/push/vapid";

type Status =
  | "checking"
  | "unsupported"
  | "denied"
  | "unsubscribed"
  | "subscribed";

function getInitialStatus(): Status {
  if (typeof window === "undefined") return "checking";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }
  return "checking";
}

export function PushSubscribeButton() {
  const [status, setStatus] = useState<Status>(getInitialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (status !== "checking") return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        const existing = await registration.pushManager.getSubscription();
        setStatus(existing ? "subscribed" : "unsubscribed");
      })
      .catch(() => setStatus("unsubscribed"));
  }, [status]);

  function handleEnable() {
    setError(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus("denied");
          return;
        }

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          setError("Las notificaciones push no están configuradas.");
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          setError("No se ha podido completar la suscripción.");
          return;
        }

        const result = await subscribeToPush({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        setStatus("subscribed");
      } catch {
        setError("No se ha podido activar las notificaciones.");
      }
    });
  }

  if (status === "checking" || status === "unsupported") {
    return null;
  }

  if (status === "subscribed") {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-emerald-300">
        🔔 Notificaciones push activadas
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        Has bloqueado las notificaciones. Actívalas desde los ajustes del
        navegador para recibir avisos aunque no tengas la app abierta.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-muted-foreground">
        Activa las notificaciones push para enterarte al instante cuando
        alguien se una a tus partidos o se cree uno nuevo.
      </p>
      <Button
        type="button"
        onClick={handleEnable}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? "Activando…" : "Activar notificaciones"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
