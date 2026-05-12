import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { SessionView } from "./session-view";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export default async function SessaoPage({ params }: Params) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session || session.userId !== user.id) {
    notFound();
  }

  return (
    <SessionView
      initialSession={{
        token: session.token,
        status: session.status,
        material: session.material,
        pointsValue: session.pointsValue,
        expiresAt: session.expiresAt.toISOString(),
      }}
    />
  );
}
