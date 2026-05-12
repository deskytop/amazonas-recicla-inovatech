import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const rows = await db
    .select({
      token: sessions.token,
      status: sessions.status,
      material: sessions.material,
      pointsValue: sessions.pointsValue,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
      completedAt: sessions.completedAt,
      userId: sessions.userId,
    })
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const session = rows[0]!;
  if (session.userId !== user.id) {
    // Mesma resposta de 404 — não revela existência de sessão de outro user.
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    token: session.token,
    status: session.status,
    material: session.material,
    pointsValue: session.pointsValue,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
  });
}
