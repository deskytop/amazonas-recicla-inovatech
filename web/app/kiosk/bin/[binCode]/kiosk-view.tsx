"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Material } from "@/lib/domain/materials";
import type { SessionStatus } from "@/lib/domain/session-lifecycle";
import { KioskIdle } from "@/components/kiosk/kiosk-idle";
import { KioskAwaiting } from "@/components/kiosk/kiosk-awaiting";
import { KioskDetected } from "@/components/kiosk/kiosk-detected";
import { KioskCompleted } from "@/components/kiosk/kiosk-completed";

interface ActiveSession {
  token: string;
  status: SessionStatus;
  material: Material | null;
  pointsValue: number | null;
  expiresAt: string;
  userDisplayName: string;
}

interface KioskViewProps {
  binId: string;
  binCode: string;
  locationName: string;
  claimUrl: string;
  initialSession: ActiveSession | null;
}

export function KioskView({
  binId,
  binCode,
  locationName,
  claimUrl,
  initialSession,
}: KioskViewProps) {
  const [session, setSession] = useState<ActiveSession | null>(initialSession);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`bin:${binId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
          filter: `bin_id=eq.${binId}`,
        },
        async (payload) => {
          const row = payload.new as {
            token: string;
            status: SessionStatus;
            material: Material | null;
            points_value: number | null;
            expires_at: string;
            user_id: string;
          };
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", row.user_id)
            .single();
          setSession({
            token: row.token,
            status: row.status,
            material: row.material,
            pointsValue: row.points_value,
            expiresAt: row.expires_at,
            userDisplayName: profile?.display_name ?? "Visitante",
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `bin_id=eq.${binId}`,
        },
        (payload) => {
          const row = payload.new as {
            token: string;
            status: SessionStatus;
            material: Material | null;
            points_value: number | null;
            expires_at: string;
          };
          setSession((prev) =>
            prev && prev.token === row.token
              ? {
                  ...prev,
                  status: row.status,
                  material: row.material,
                  pointsValue: row.points_value,
                  expiresAt: row.expires_at,
                }
              : prev,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [binId]);

  // Reset apos 5s no completed
  useEffect(() => {
    if (session?.status === "completed") {
      const id = setTimeout(() => setSession(null), 5000);
      return () => clearTimeout(id);
    }
  }, [session?.status]);

  // Reset apos 3s em estados terminais negativos
  useEffect(() => {
    if (session?.status === "expired" || session?.status === "failed") {
      const id = setTimeout(() => setSession(null), 3000);
      return () => clearTimeout(id);
    }
  }, [session?.status]);

  if (!session) {
    return <KioskIdle claimUrl={claimUrl} binCode={binCode} locationName={locationName} />;
  }

  if (session.status === "awaiting_material") {
    return (
      <KioskAwaiting
        userDisplayName={session.userDisplayName}
        expiresAt={session.expiresAt}
      />
    );
  }

  if (session.status === "material_detected" && session.material) {
    return (
      <KioskDetected
        userDisplayName={session.userDisplayName}
        material={session.material}
        pointsValue={session.pointsValue ?? 0}
      />
    );
  }

  if (session.status === "completed" && session.material) {
    return (
      <KioskCompleted
        userDisplayName={session.userDisplayName}
        material={session.material}
        pointsValue={session.pointsValue ?? 0}
      />
    );
  }

  return <KioskIdle claimUrl={claimUrl} binCode={binCode} locationName={locationName} />;
}
