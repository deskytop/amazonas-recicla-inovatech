"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { bins, sessions, profiles } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  generateSessionToken,
  SESSION_TTL_SECONDS,
} from "@/lib/domain/session-lifecycle";
import { broadcastBinSession } from "@/lib/realtime/broadcast";

export type CreateSessionResult =
  | { ok: true; token: string }
  | { ok: false; error: "unauthenticated" | "bin_not_found" | "bin_unavailable" | "bin_in_use" };

export async function createSessionAction(binCode: string): Promise<CreateSessionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }

  const [bin] = await db.select().from(bins).where(eq(bins.code, binCode)).limit(1);
  if (!bin) {
    return { ok: false, error: "bin_not_found" };
  }
  if (bin.status !== "active") {
    return { ok: false, error: "bin_unavailable" };
  }

  const existing = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.binId, bin.id),
        inArray(sessions.status, ["awaiting_material", "material_detected"]),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "bin_in_use" };
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await db.insert(sessions).values({
    token,
    binId: bin.id,
    userId: user.id,
    status: "awaiting_material",
    expiresAt,
  });

  // Notifica o kiosk via broadcast (sem expor dados privados via RLS)
  const [profile] = await db
    .select({ displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  await broadcastBinSession(bin.id, {
    token,
    status: "awaiting_material",
    material: null,
    pointsValue: null,
    expiresAt: expiresAt.toISOString(),
    userDisplayName: profile?.displayName ?? "Visitante",
  });

  redirect(`/app/sessao/${token}`);
}
