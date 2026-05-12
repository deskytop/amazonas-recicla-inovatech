import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { bins, sessions, profiles } from "@/lib/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { verifyBinKey } from "@/lib/auth/bin-key";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: Params) {
  const { code } = await params;

  const providedKey = request.headers.get("x-bin-key");
  if (!providedKey) {
    return NextResponse.json({ error: "missing_bin_key" }, { status: 401 });
  }

  const [bin] = await db.select().from(bins).where(eq(bins.code, code)).limit(1);
  if (!bin) {
    return NextResponse.json({ error: "bin_not_found" }, { status: 404 });
  }
  const valid = await verifyBinKey(providedKey, bin.apiKeyHash);
  if (!valid) {
    return NextResponse.json({ error: "invalid_bin_key" }, { status: 401 });
  }

  const rows = await db
    .select({
      token: sessions.token,
      status: sessions.status,
      expiresAt: sessions.expiresAt,
      userDisplayName: profiles.displayName,
    })
    .from(sessions)
    .innerJoin(profiles, eq(sessions.userId, profiles.id))
    .where(
      and(
        eq(sessions.binId, bin.id),
        inArray(sessions.status, ["awaiting_material", "material_detected"]),
      ),
    )
    .orderBy(desc(sessions.createdAt))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ active: false });
  }

  const row = rows[0]!;
  return NextResponse.json({
    active: true,
    token: row.token,
    userDisplayName: row.userDisplayName,
    status: row.status,
    expiresAt: row.expiresAt.toISOString(),
  });
}
