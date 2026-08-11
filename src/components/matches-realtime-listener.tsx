"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

// Refreshes the matches list live when matches are created/updated or
// players join/leave any match, so MatchCard slot counts and quadrants
// stay in sync without a manual reload.
export function MatchesRealtimeListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    const subscribe = (client: SupabaseClient) => {
      channel = client
        .channel("matches-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "match_players" },
          () => router.refresh(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "matches" },
          () => router.refresh(),
        )
        .subscribe();
    };

    subscribe(supabase);

    // iOS Safari/PWA drops the Realtime WebSocket once the tab/app loses
    // focus (backgrounded, screen locked). Neither the socket nor the
    // channel auto-recovers reliably on their own, so when the app comes
    // back to the foreground we force a refresh (to catch anything missed
    // while disconnected) and resubscribe if the channel isn't joined.
    const handleForeground = () => {
      if (document.visibilityState !== "visible") return;

      router.refresh();

      if (channel && channel.state !== "joined") {
        supabase.removeChannel(channel);
        subscribe(supabase);
      }
    };

    document.addEventListener("visibilitychange", handleForeground);
    window.addEventListener("focus", handleForeground);

    return () => {
      document.removeEventListener("visibilitychange", handleForeground);
      window.removeEventListener("focus", handleForeground);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
