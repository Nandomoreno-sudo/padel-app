import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "./actions";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, match_id, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = notifications ?? [];
  const hasUnread = items.some((n) => !n.read);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-6 pb-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Avisos</h1>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary">
              Marcar todo como leído
            </Button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no tienes avisos.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((notification) => (
            <li key={notification.id}>
              <Link
                href={`/matches/${notification.match_id}`}
                className={`block rounded-2xl border border-border p-4 text-sm transition-colors active:bg-surface-hover ${
                  notification.read ? "bg-surface" : "bg-emerald-500/10"
                }`}
              >
                {notification.message}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
