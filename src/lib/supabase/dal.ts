import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Memoized per request so layout + page can both call this without an
// extra round trip. Proxy already guarantees a session exists for
// non-public paths; this adds the role check, done close to the data
// per Next's auth guidance rather than relying on proxy alone.
export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }

  return { user, supabase };
});
