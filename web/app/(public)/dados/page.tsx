import { db } from "@/lib/db/client";
import { sessions, profiles } from "@/lib/db/schema";
import { eq, count, sum } from "drizzle-orm";
import { StatCard } from "@/components/public/stat-card";
import { TrendingUp, AlertTriangle, Coins, Leaf } from "lucide-react";

export const dynamic = "force-dynamic";

const KG_PER_POINT_PLASTIC = 0.05;

export default async function DadosPage() {
  const [totals] = await db
    .select({
      totalSessions: count(),
      totalPoints: sum(sessions.pointsValue),
    })
    .from(sessions)
    .where(eq(sessions.status, "completed"));

  const [userCount] = await db.select({ count: count() }).from(profiles);

  const sessionsByMaterial = await db
    .select({
      material: sessions.material,
      total: count(),
    })
    .from(sessions)
    .where(eq(sessions.status, "completed"))
    .groupBy(sessions.material);

  const completedCount = totals?.totalSessions ?? 0;
  const totalPoints = Number(totals?.totalPoints ?? 0);
  const totalUsers = userCount?.count ?? 0;
  const estimatedKg = (totalPoints * KG_PER_POINT_PLASTIC).toFixed(1);

  const MATERIAL_LABELS = {
    plastic: "Plástico",
    metal: "Metal",
    glass: "Vidro",
    paper: "Papel",
  } as const;

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
      <header className="space-y-3 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Dados de impacto
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary">
          Em números reais
        </h1>
      </header>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Nosso impacto</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Métricas agregadas do sistema. Atualizadas a cada visita.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard value={completedCount.toString()} label="Descartes registrados" highlight />
          <StatCard value={totalPoints.toString()} label="Pontos creditados" highlight />
          <StatCard value={totalUsers.toString()} label="Pessoas cadastradas" />
          <StatCard value={`${estimatedKg} kg`} label="Estimativa de resíduos (plástico equiv.)" />
        </div>

        {sessionsByMaterial.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display font-semibold mb-3">Por material</p>
            <ul className="space-y-2">
              {sessionsByMaterial.map((row) => (
                <li key={row.material ?? "outros"} className="flex items-center justify-between">
                  <span className="text-sm">
                    {row.material ? MATERIAL_LABELS[row.material as keyof typeof MATERIAL_LABELS] : "Outros"}
                  </span>
                  <span className="font-mono text-sm font-semibold">{row.total}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="font-display text-xl font-bold">O problema na Amazônia</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard value="91,9%" label="Municípios do Amazonas usam lixões" source="IBGE 2024" />
          <StatCard value="182 mil ton" label="Plástico nos rios amazônicos/ano" source="UFPA 2024" />
          <StatCard value="98%" label="Espécies de peixes com microplásticos" source="Oceana Brasil 2024" />
          <StatCard value="3 mil" label="Lixões ativos no Brasil" source="ABREMA 2025" />
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Custo econômico do descarte ruim</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard value="R$ 120 bi" label="Perdas anuais no Brasil" source="EMBRAPA 2025" />
          <StatCard value="R$ 90 bi" label="Externalidades adicionais (saúde, etc)" source="ABREMA 2025" />
          <StatCard value="344 mil" label="Internações SUS/ano por saneamento ruim" source="Trata Brasil" />
          <StatCard value="4,5–8,3%" label="Taxa real de reciclagem (potencial 33,6%)" source="EMBRAPA 2025" />
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Incentivos disponíveis</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard value="5–20%" label="Desconto IPTU Verde Manaus (PL 128/2025)" source="CMM 2025" />
          <StatCard value="R$ 2 mi" label="Bônus de energia distribuídos pelo Ecoenel em 2025" source="Enel 2025" />
          <StatCard value="R$ 530 mi" label="Lei de Incentivo à Reciclagem 2025" source="Câmara dos Deputados" />
        </div>
      </section>
    </div>
  );
}
