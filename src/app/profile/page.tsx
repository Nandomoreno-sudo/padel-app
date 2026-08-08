import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { LevelBadge } from "@/components/level-badge";
import { LogoutButton } from "./logout-button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, level, is_admin")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-6 px-4 py-10 pb-28">
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar name={profile?.name} seed={user.id} size="lg" />
        <div>
          <h1 className="text-xl font-semibold">
            {profile?.name ?? "Sin nombre"}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <LevelBadge level={profile?.level} />
      </div>

      <dl className="space-y-3 rounded-2xl border border-border bg-surface p-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Teléfono</dt>
          <dd>{profile?.phone ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Rol</dt>
          <dd>{profile?.is_admin ? "Administrador" : "Jugador"}</dd>
        </div>
      </dl>

      <LogoutButton />
    </main>
  );
}
