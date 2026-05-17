import { db } from "@/lib/db/client";
import { bins } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BinMap } from "@/components/app/bin-map";
import { MapPin, Circle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const activeBins = await db
    .select()
    .from(bins)
    .where(and(eq(bins.status, "active"), isNotNull(bins.latitude), isNotNull(bins.longitude)));

  const binsForMap = activeBins
    .filter((b) => b.latitude !== null && b.longitude !== null)
    .map((b) => ({
      id: b.id,
      code: b.code,
      locationName: b.locationName,
      latitude: Number(b.latitude!),
      longitude: Number(b.longitude!),
    }));

  return (
    <div className="p-4 space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">Mapa</h1>
        <p className="text-sm text-muted-foreground">
          Lixeiras Amazonas Recicla ativas perto de você.
        </p>
      </header>

      <BinMap bins={binsForMap} />

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">
          Lixeiras ativas ({activeBins.length})
        </h2>
        <ul className="space-y-2">
          {activeBins.map((bin) => (
            <li key={bin.id}>
              <Card className="p-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/10 h-10 w-10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold">{bin.locationName}</p>
                  <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {bin.code}
                  </p>
                </div>
                <Badge variant="default" className="font-mono gap-1">
                  <Circle className="h-2 w-2 fill-current" />
                  Ativa
                </Badge>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
