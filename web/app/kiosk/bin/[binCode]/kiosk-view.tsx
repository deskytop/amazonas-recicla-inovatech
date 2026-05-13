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

    // Escuta broadcasts disparados pelas mutations server-side.
    // Mais seguro que postgres_changes: payload e sanitizado pelo backend
    // (sem expor pontos/level/email via RLS aberta).
    const channel = supabase
      .channel(`bin:${binId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "session_change" }, (message) => {
        const payload = message.payload as {
          token: string;
          status: SessionStatus;
          material: Material | null;
          pointsValue: number | null;
          expiresAt: string;
          userDisplayName: string;
        };
        setSession(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [binId]);

  // Expiracao client-side: se sessao em awaiting_material/material_detected
  // ultrapassa expires_at, considera expired (fallback porque pg_cron expira no
  // banco mas nao dispara broadcast — o kiosk decide visualmente).
  useEffect(() => {
    if (!session) return;
    if (session.status !== "awaiting_material" && session.status !== "material_detected") {
      return;
    }
    const remaining = new Date(session.expiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      setSession((s) => (s ? { ...s, status: "expired" } : s));
      return;
    }
    const id = setTimeout(() => {
      setSession((s) =>
        s && (s.status === "awaiting_material" || s.status === "material_detected")
          ? { ...s, status: "expired" }
          : s,
      );
    }, remaining);
    return () => clearTimeout(id);
  }, [session?.status, session?.expiresAt]);

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
