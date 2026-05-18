"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface HeaderPointsBadgeProps {
  userId: string;
  initialTotalPoints: number;
}

export function HeaderPointsBadge({
  userId,
  initialTotalPoints,
}: HeaderPointsBadgeProps) {
  const [totalPoints, setTotalPoints] = useState(initialTotalPoints);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      if (cancelled || !authSession) return;

      await supabase.realtime.setAuth(authSession.access_token);
      if (cancelled) return;

      channel = supabase
        .channel(`profile:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as { total_points?: number };
            if (typeof row.total_points === "number") {
              setTotalPoints(row.total_points);
            }
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/app/perfil"
      className="inline-flex items-baseline gap-1.5 px-3 py-1.5 border border-primary/30 hover:border-primary hover:bg-primary/5 transition-colors"
    >
      <span className="font-stat text-base font-bold text-primary tabular-nums leading-none">
        {totalPoints}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground leading-none">
        pts
      </span>
    </Link>
  );
}
