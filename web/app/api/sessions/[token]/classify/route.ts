import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sessions, bins, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyBinKey } from "@/lib/auth/bin-key";
import { classifyRequestSchema } from "@/lib/api/validation";
import { canTransition } from "@/lib/domain/session-lifecycle";
import { pointsForMaterial } from "@/lib/domain/materials";
import { broadcastBinSession } from "@/lib/realtime/broadcast";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  const providedKey = request.headers.get("x-bin-key");
  if (!providedKey) {
    return NextResponse.json({ error: "missing_bin_key" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = classifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", details: parsed.error.format() },
      { status: 422 },
    );
  }

  const rows = await db
    .select({ session: sessions, bin: bins })
    .from(sessions)
    .innerJoin(bins, eq(sessions.binId, bins.id))
    .where(eq(sessions.token, token))
    .limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }
  const { session, bin } = rows[0]!;

  if (!(await verifyBinKey(providedKey, bin.apiKeyHash))) {
    return NextResponse.json({ error: "invalid_bin_key" }, { status: 401 });
  }

  if (!canTransition(session.status, "material_detected")) {
    return NextResponse.json(
      { error: "invalid_transition", from: session.status, to: "material_detected" },
      { status: 409 },
    );
  }

  if (session.expiresAt < new Date()) {
    return NextResponse.json({ error: "session_expired" }, { status: 410 });
  }

  const pointsValue = pointsForMaterial(parsed.data.material);

  await db
    .update(sessions)
    .set({
      status: "material_detected",
      material: parsed.data.material,
      pointsValue,
      materialDetectedAt: new Date(),
    })
    .where(eq(sessions.token, token));

  // Notifica o kiosk via broadcast
  const [profile] = await db
    .select({ displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, session.userId))
    .limit(1);
  await broadcastBinSession(bin.id, {
    token,
    status: "material_detected",
    material: parsed.data.material,
    pointsValue,
    expiresAt: session.expiresAt.toISOString(),
    userDisplayName: profile?.displayName ?? "Visitante",
  });

  return NextResponse.json({
    ok: true,
    pointsValue,
    destinationCompartment: parsed.data.material,
  });
}
