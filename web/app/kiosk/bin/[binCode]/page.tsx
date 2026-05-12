import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { bins, sessions, profiles } from "@/lib/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { KioskView } from "./kiosk-view";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ binCode: string }> };

export default async function KioskPage({ params }: Params) {
  const { binCode } = await params;

  const [bin] = await db.select().from(bins).where(eq(bins.code, binCode)).limit(1);
  if (!bin) {
    notFound();
  }

  const activeRows = await db
    .select({
      token: sessions.token,
      status: sessions.status,
      material: sessions.material,
      pointsValue: sessions.pointsValue,
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

  // Constroi URL absoluta a partir dos headers do request — funciona em qualquer
  // ambiente (local, preview, producao) sem depender de NEXT_PUBLIC_SITE_URL ser configurada.
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol =
    headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const claimUrl = `${protocol}://${host}/app/bin/${bin.code}/iniciar`;

  return (
    <KioskView
      binId={bin.id}
      binCode={bin.code}
      locationName={bin.locationName}
      claimUrl={claimUrl}
      initialSession={
        activeRows[0]
          ? {
              token: activeRows[0].token,
              status: activeRows[0].status,
              material: activeRows[0].material,
              pointsValue: activeRows[0].pointsValue,
              expiresAt: activeRows[0].expiresAt.toISOString(),
              userDisplayName: activeRows[0].userDisplayName,
            }
          : null
      }
    />
  );
}
