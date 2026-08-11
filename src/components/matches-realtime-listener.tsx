"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Refreshes the matches list live when players join/leave any match, so
// MatchCard slot counts and quadrants stay in sync without a manual reload.
export function MatchesRealtimeListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("matches-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_players" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "match_players" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
