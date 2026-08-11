import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "Faltan las claves VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT).",
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

// Sends `payload` to every subscription, dropping the ones the push
// service reports as gone (404/410 — the user uninstalled, cleared site
// data, etc.) instead of retrying them forever. Returns their endpoints so
// the caller can delete the matching push_subscriptions rows.
export async function sendPushNotifications(
  subscriptions: PushSubscriptionRow[],
  payload: PushPayload,
): Promise<string[]> {
  if (subscriptions.length === 0) return [];
  ensureConfigured();

  const body = JSON.stringify(payload);
  const staleEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
      } catch (error) {
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? (error as { statusCode?: number }).statusCode
            : undefined;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error("web-push send failed:", sub.endpoint, error);
        }
      }
    }),
  );

  return staleEndpoints;
}

export async function deleteStaleSubscriptions(
  supabase: SupabaseClient,
  endpoints: string[],
): Promise<void> {
  if (endpoints.length === 0) return;
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .in("endpoint", endpoints);
  if (error) {
    console.error("deleteStaleSubscriptions failed:", error);
  }
}
