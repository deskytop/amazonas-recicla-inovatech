import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { sessions, bins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MaterialIcon } from "@/components/app/material-icon";
import { BackButton } from "@/components/app/back-button";
import { Card } from "@/components/ui/card";
import { MATERIAL_LABELS, type Material } from "@/lib/domain/materials";
import { Sparkles, MapPin, Calendar, ImageOff } from "lucide-react";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ sessionId: string }> };

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function DescarteDetalhePage({ params }: Params) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rows = await db
    .select({
      id: sessions.id,
      material: sessions.material,
      pointsValue: sessions.pointsValue,
      completedAt: sessions.completedAt,
      imageUrl: sessions.imageUrl,
      userId: sessions.userId,
      binLocationName: bins.locationName,
    })
    .from(sessions)
    .innerJoin(bins, eq(sessions.binId, bins.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (rows.length === 0) notFound();
  const row = rows[0]!;
  if (row.userId !== user.id) notFound();
  if (!row.material || !row.pointsValue || !row.completedAt) notFound();

  const material = row.material as Material;

  return (
    <div className="p-4 space-y-5">
      <BackButton href="/app/historico" label="Voltar ao histórico" />

      <header className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Detalhe do descarte
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {DATE_FORMAT.format(row.completedAt)}
        </p>
      </header>

      <Card className="p-6 flex flex-col items-center gap-4 text-center">
        <MaterialIcon material={material} size={56} />
        <div>
          <p className="font-display text-2xl font-bold">
            {MATERIAL_LABELS[material]}
          </p>
          <p className="font-display text-4xl font-bold text-primary tabular-nums">
            +{row.pointsValue} pts
          </p>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Lixeira
            </p>
            <p className="font-display text-base">{row.binLocationName}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Concluído em
            </p>
            <p className="font-display text-base">
              {DATE_FORMAT.format(row.completedAt)}
            </p>
          </div>
        </div>
      </Card>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-foreground" />
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Imagem analisada pela IA
          </h2>
        </div>
        {row.imageUrl ? (
          <figure className="rounded-md overflow-hidden border border-border">
            <img
              src={row.imageUrl}
              alt={`Material descartado: ${MATERIAL_LABELS[material]}`}
              className="w-full h-auto"
            />
            <figcaption className="bg-muted/40 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Captura via ESP32-CAM • classificação por Claude Sonnet 4.6 vision
            </figcaption>
          </figure>
        ) : (
          <Card className="p-6 flex flex-col items-center gap-2 bg-muted/40 border-dashed">
            <ImageOff className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Sem imagem armazenada para este descarte.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
