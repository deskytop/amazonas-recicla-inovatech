import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { bins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyBinKey } from "@/lib/auth/bin-key";
import { heartbeatRequestSchema } from "@/lib/api/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: Params) {
  const { code } = await params;

  const providedKey = request.headers.get("x-bin-key");
  if (!providedKey) {
    return NextResponse.json({ error: "missing_bin_key" }, { status: 401 });
  }

  const [bin] = await db.select().from(bins).where(eq(bins.code, code)).limit(1);
  if (!bin) {
    return NextResponse.json({ error: "bin_not_found" }, { status: 404 });
  }
  if (!(await verifyBinKey(providedKey, bin.apiKeyHash))) {
    return NextResponse.json({ error: "invalid_bin_key" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = heartbeatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", details: parsed.error.format() },
      { status: 422 },
    );
  }

  await db
    .update(bins)
    .set({
      lastSeenAt: new Date(),
      fillLevelPercent: parsed.data.fillLevelPercent,
      updatedAt: new Date(),
    })
    .where(eq(bins.id, bin.id));

  return NextResponse.json({ ok: true });
}
