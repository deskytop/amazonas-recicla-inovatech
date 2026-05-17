import { db } from "@/lib/db/client";
import { sessions, profiles } from "@/lib/db/schema";
import { eq, count, sum } from "drizzle-orm";

export const dynamic = "force-dynamic";

const KG_PER_POINT_PLASTIC = 0.05;

const MATERIAL_LABELS = {
  plastic: "Plástico",
  metal: "Metal",
  glass: "Vidro",
  paper: "Papel",
} as const;

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
    .select({ material: sessions.material, total: count() })
    .from(sessions)
    .where(eq(sessions.status, "completed"))
    .groupBy(sessions.material);

  const completedCount = totals?.totalSessions ?? 0;
  const totalPoints = Number(totals?.totalPoints ?? 0);
  const totalUsers = userCount?.count ?? 0;
  const estimatedKg = (totalPoints * KG_PER_POINT_PLASTIC).toFixed(1);

  return (
    <>
      {/* ============================================================
       * HERO de dados — nosso impacto real, em destaque máximo
       * ============================================================ */}
      <section className="bg-mesh-eco bg-grain border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 space-y-12 anim-editorial">
          <header className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
                <span className="inline-block w-8 h-px bg-amber-accent" />
                <span>§ Painel</span>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Atualizado em tempo real <br />
                a cada visita
              </p>
            </div>
            <div className="md:col-span-8">
              <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary leading-[0.92]">
                Dados em
                <span className="block italic font-medium text-foreground">
                  números reais.
                </span>
              </h1>
            </div>
          </header>

          <div className="grid md:grid-cols-12 gap-x-6 gap-y-12 pt-8 border-t-2 border-primary/15">
            <HeroStat
              className="md:col-span-6"
              value={completedCount.toString()}
              label="Descartes registrados em produção"
              source="Tabela sessions · status=completed"
            />
            <HeroStat
              className="md:col-span-6"
              value={totalPoints.toString()}
              label="Pontos creditados acumulados"
              source="Soma de session.points_value"
              accent
            />
            <HeroStat
              className="md:col-span-4"
              value={totalUsers.toString()}
              label="Pessoas cadastradas"
              source="Tabela auth.users + profiles"
              size="md"
            />
            <HeroStat
              className="md:col-span-4"
              value={`${estimatedKg}`}
              unit="kg"
              label="Estimativa de massa de plástico equivalente"
              source="0,05 kg/pt (heurística)"
              size="md"
            />
            <HeroStat
              className="md:col-span-4"
              value={sessionsByMaterial.length.toString()}
              label="Categorias de material recicladas"
              source="Distinct material em sessions"
              size="md"
            />
          </div>

          {sessionsByMaterial.length > 0 && (
            <div className="grid md:grid-cols-12 gap-6 pt-8 border-t border-primary/15">
              <p className="md:col-span-3 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent self-start mt-1">
                Por material
              </p>
              <ul className="md:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {sessionsByMaterial.map((row) => (
                  <li key={row.material ?? "outros"} className="space-y-1 border-l-2 border-primary pl-3">
                    <p className="font-stat text-4xl text-foreground tabular-nums">
                      {row.total}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {row.material
                        ? MATERIAL_LABELS[row.material as keyof typeof MATERIAL_LABELS]
                        : "Outros"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
       * PROBLEMA — dark editorial, mesmo padrão da home
       * ============================================================ */}
      <section className="bg-foreground text-background bg-grain">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 space-y-16">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <p className="md:col-span-3 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
              § 02 — o problema
            </p>
            <h2 className="md:col-span-9 font-headline text-4xl md:text-6xl font-bold leading-[0.95]">
              A Amazônia tem
              <span className="block italic font-medium text-amber-accent">
                a pior gestão
              </span>
              de resíduos do Brasil.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            <DarkStat
              number="91,9%"
              label="dos municípios do Amazonas ainda usam lixões a céu aberto"
              source="IBGE · Pesquisa Nacional de Saneamento Básico, 2024"
            />
            <DarkStat
              number="182 k"
              unit="ton"
              label="de plástico despejadas nos rios amazônicos por ano"
              source="UFPA · Oceana Brasil, 2024"
            />
            <DarkStat
              number="98%"
              label="das espécies de peixes analisadas contêm microplásticos"
              source="Oceana Brasil, 2024"
            />
            <DarkStat
              number="3 mil"
              label="lixões ainda ativos no território brasileiro"
              source="ABREMA, 2025"
            />
          </div>
        </div>
      </section>

      {/* ============================================================
       * CUSTO ECONÔMICO
       * ============================================================ */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 space-y-16">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <p className="md:col-span-3 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
              § 03 — o custo
            </p>
            <h2 className="md:col-span-9 font-headline text-4xl md:text-6xl font-bold text-primary leading-[0.95]">
              Descarte ruim
              <span className="block italic font-medium text-foreground">
                custa caro.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            <LightStat
              number="R$ 120 bi"
              label="é a perda anual estimada no Brasil"
              source="EMBRAPA, 2025"
            />
            <LightStat
              number="R$ 90 bi"
              label="em externalidades adicionais (saúde, contaminação)"
              source="ABREMA, 2025"
            />
            <LightStat
              number="344 mil"
              label="internações SUS/ano por saneamento inadequado"
              source="Instituto Trata Brasil"
            />
            <LightStat
              number="4,5–8%"
              label="é tudo o que o Brasil recicla — potencial é 33,6%"
              source="EMBRAPA, 2025"
            />
          </div>
        </div>
      </section>

      {/* ============================================================
       * INCENTIVOS DISPONÍVEIS — accent positivo
       * ============================================================ */}
      <section className="bg-amber-accent/10 border-y border-amber-accent/30">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 space-y-16">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <p className="md:col-span-3 font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
              § 04 — os incentivos
            </p>
            <h2 className="md:col-span-9 font-headline text-4xl md:text-6xl font-bold text-primary leading-[0.95]">
              Mecanismos legais
              <span className="block italic font-medium text-foreground">
                já existem.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <LightStat
              number="5–20%"
              label="desconto IPTU Verde Manaus"
              source="PL 128/2025 · Câmara Municipal de Manaus"
            />
            <LightStat
              number="R$ 2 mi"
              label="distribuídos em créditos Ecoenel em 2025"
              source="Relatório Enel · 2025"
            />
            <LightStat
              number="R$ 530 mi"
              label="aprovados na Lei de Incentivo à Reciclagem"
              source="Câmara dos Deputados · 2025"
            />
          </div>

          <p className="font-headline text-2xl md:text-3xl italic font-medium text-foreground/85 max-w-3xl leading-snug pt-8 border-t border-amber-accent/30">
            “O incentivo existe. A barreira é{" "}
            <span className="text-primary not-italic font-bold">a comprovação</span>.
            É aí que o Amazonas Recicla entra.”
          </p>
        </div>
      </section>
    </>
  );
}

// ============================================================
// Stat displays — três variantes para diferentes contextos
// ============================================================

function HeroStat({
  value,
  label,
  source,
  unit,
  accent,
  size = "lg",
  className = "",
}: {
  value: string;
  label: string;
  source: string;
  unit?: string;
  accent?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const sizeClass = size === "lg" ? "text-7xl md:text-9xl" : "text-5xl md:text-7xl";
  const valueColor = accent ? "text-amber-accent" : "text-primary";

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start gap-2">
        <p className={`font-stat ${sizeClass} ${valueColor} tabular-nums`}>{value}</p>
        {unit && (
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-2">
            {unit}
          </span>
        )}
      </div>
      <p className="text-base md:text-lg text-foreground/85 leading-snug max-w-sm">
        {label}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {source}
      </p>
    </div>
  );
}

function DarkStat({
  number,
  label,
  source,
  unit,
}: {
  number: string;
  label: string;
  source: string;
  unit?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <p className="font-stat text-[5rem] md:text-[8rem] text-background tabular-nums">
          {number}
        </p>
        {unit && (
          <span className="font-mono text-xs uppercase tracking-widest text-background/60 mt-3">
            {unit}
          </span>
        )}
      </div>
      <div className="pl-4 border-l-2 border-amber-accent space-y-2">
        <p className="text-lg md:text-xl text-background/90 leading-snug max-w-xs">
          {label}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-background/50">
          {source}
        </p>
      </div>
    </div>
  );
}

function LightStat({
  number,
  label,
  source,
}: {
  number: string;
  label: string;
  source: string;
}) {
  return (
    <div className="space-y-4">
      <p className="font-stat text-[5rem] md:text-[7rem] text-primary tabular-nums">
        {number}
      </p>
      <div className="pl-4 border-l-2 border-amber-accent space-y-2">
        <p className="text-lg text-foreground/85 leading-snug max-w-xs">{label}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {source}
        </p>
      </div>
    </div>
  );
}
