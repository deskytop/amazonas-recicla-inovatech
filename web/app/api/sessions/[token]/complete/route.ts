import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sessions, bins, profiles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyBinKey } from "@/lib/auth/bin-key";
import { canTransition } from "@/lib/domain/session-lifecycle";
import { levelForLifetimePoints } from "@/lib/domain/levels";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  const providedKey = request.headers.get("x-bin-key");
  if (!providedKey) {
    return NextResponse.json({ error: "missing_bin_key" }, { status: 401 });
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

  if (!canTransition(session.status, "completed")) {
    return NextResponse.json(
      { error: "invalid_transition", from: session.status, to: "completed" },
      { status: 409 },
    );
  }

  if (!session.pointsValue) {
    return NextResponse.json({ error: "missing_points_value" }, { status: 500 });
  }

  const pointsToCredit = session.pointsValue;

  // Transação atômica: marca sessão como completed + credita pontos + atualiza nível
  await db.transaction(async (tx) => {
    await tx
      .update(sessions)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(sessions.token, token));

    await tx
      .update(profiles)
      .set({
        totalPoints: sql`${profiles.totalPoints} + ${pointsToCredit}`,
        lifetimePointsEarned: sql`${profiles.lifetimePointsEarned} + ${pointsToCredit}`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, session.userId));

    // Lê o novo lifetime para calcular o nível atualizado
    const [updated] = await tx
      .select({ lifetime: profiles.lifetimePointsEarned })
      .from(profiles)
      .where(eq(profiles.id, session.userId))
      .limit(1);

    if (updated) {
      const newLevel = levelForLifetimePoints(updated.lifetime);
      await tx
        .update(profiles)
        .set({ level: newLevel.id })
        .where(eq(profiles.id, session.userId));
    }
  });

  return NextResponse.json({ ok: true, pointsCredited: pointsToCredit });
}
