import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { bins, sessions } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import {
  generateSessionToken,
  SESSION_TTL_SECONDS,
} from "@/lib/domain/session-lifecycle";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { code } = await params;

  // 1. Autenticação: precisa ter sessão Supabase válida
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // 2. Localizar a bin
  const [bin] = await db.select().from(bins).where(eq(bins.code, code)).limit(1);
  if (!bin) {
    return NextResponse.json({ error: "bin_not_found" }, { status: 404 });
  }
  if (bin.status !== "active") {
    return NextResponse.json(
      { error: "bin_unavailable", status: bin.status },
      { status: 503 },
    );
  }

  // 3. Verifica que NÃO existe sessão ativa nesta bin
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
    return NextResponse.json(
      { error: "bin_in_use", expiresAt: existing[0]!.expiresAt },
      { status: 409 },
    );
  }

  // 4. Cria a sessão
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const [created] = await db
    .insert(sessions)
    .values({
      token,
      binId: bin.id,
      userId: user.id,
      status: "awaiting_material",
      expiresAt,
    })
    .returning();

  if (!created) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      token,
      expiresAt: expiresAt.toISOString(),
      redirectTo: `/app/sessao/${token}`,
    },
    { status: 201 },
  );
}
