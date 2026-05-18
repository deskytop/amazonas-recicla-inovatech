import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { sessions, bins } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { DiscardHistoryCard } from "@/components/app/discard-history-card";
import { History } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Material } from "@/lib/domain/materials";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rows = await db
    .select({
      id: sessions.id,
      material: sessions.material,
      pointsValue: sessions.pointsValue,
      completedAt: sessions.completedAt,
      binLocationName: bins.locationName,
    })
    .from(sessions)
    .innerJoin(bins, eq(sessions.binId, bins.id))
    .where(and(eq(sessions.userId, user.id), eq(sessions.status, "completed")))
    .orderBy(desc(sessions.completedAt))
    .limit(20);

  const total = rows.reduce((sum, r) => sum + (r.pointsValue ?? 0), 0);

  return (
    <div className="p-4 space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">Histórico</h1>
        <p className="text-sm text-muted-foreground">
          Seus descartes mais recentes.
        </p>
      </header>

      {rows.length === 0 ? (
        <Card className="p-10 text-center space-y-3 bg-muted/40 border-dashed">
          <History className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Você ainda não fez nenhum descarte.
          </p>
          <p className="text-xs text-muted-foreground">
            Procure uma lixeira Amazonas Recicla e comece.
          </p>
        </Card>
      ) : (
        <>
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Total acumulado
            </p>
            <p className="font-display text-2xl font-bold text-primary">
              {total.toLocaleString("pt-BR")} pts em {rows.length} descartes
            </p>
          </Card>
          <ul className="space-y-2">
            {rows.map((row) =>
              row.material && row.pointsValue && row.completedAt ? (
                <li key={row.id}>
                  <DiscardHistoryCard
                    sessionId={row.id}
                    material={row.material as Material}
                    pointsValue={row.pointsValue}
                    completedAt={row.completedAt}
                    binLocationName={row.binLocationName}
                  />
                </li>
              ) : null,
            )}
          </ul>
        </>
      )}
    </div>
  );
}
