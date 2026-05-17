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
      {/* PAINEL */}
      <section className="bg-mesh-eco bg-grain border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-10 anim-editorial">
          <header className="space-y-3">
            <div className="flex items-center gap-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
              <span className="inline-block w-6 h-px bg-amber-accent" />
              <span>Painel · tempo real</span>
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary leading-[0.92] max-w-2xl">
              Dados em
              <span className="block italic font-medium text-foreground">
                números reais.
              </span>
            </h1>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10 pt-6 border-t-2 border-primary/15">
            <BigStat
              value={completedCount.toString()}
              label="Descartes registrados"
              source="sessions · completed"
              accent="primary"
              span="col-span-2 md:col-span-1"
            />
            <BigStat
              value={totalPoints.toString()}
              label="Pontos creditados"
              source="soma de points_value"
              accent="amber"
            />
            <BigStat
              value={totalUsers.toString()}
              label="Pessoas cadastradas"
              source="profiles"
              accent="primary"
            />
            <BigStat
              value={estimatedKg}
              unit="kg"
              label="Plástico equivalente"
              source="0,05 kg/pt"
              accent="primary"
            />
            <BigStat
              value={sessionsByMaterial.length.toString()}
              label="Materiais reciclados"
              source="distinct material"
              accent="amber"
            />
          </div>

          {sessionsByMaterial.length > 0 && (
            <div className="pt-6 border-t border-primary/15">
              <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent mb-3">
                Distribuição por material
              </p>
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sessionsByMaterial.map((row) => (
                  <li key={row.material ?? "outros"} className="border-l-2 border-primary pl-3 py-1">
                    <p className="font-stat text-3xl md:text-4xl text-foreground tabular-nums leading-none">
                      {row.total}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
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

      {/* PROBLEMA */}
      <section className="bg-foreground text-background bg-grain">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-24 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-12 gap-4 md:gap-8 items-end">
            <p className="md:col-span-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
              § 02 · O problema
            </p>
            <h2 className="md:col-span-9 font-headline text-3xl sm:text-4xl md:text-6xl font-bold leading-[0.95]">
              A pior gestão
              <span className="block italic font-medium text-amber-accent">
                de resíduos
              </span>
              do Brasil.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-10 md:gap-x-12 md:gap-y-14">
            <DarkStat number="91,9%" label="dos municípios do AM usam lixões" source="IBGE, 2024" />
            <DarkStat number="182k" unit="t" label="de plástico nos rios/ano" source="UFPA, 2024" />
            <DarkStat number="98%" label="das espécies de peixes têm microplástico" source="Oceana Brasil, 2024" />
            <DarkStat number="3 mil" label="lixões ativos no Brasil" source="ABREMA, 2025" />
          </div>
        </div>
      </section>

      {/* CUSTO */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-24 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-12 gap-4 md:gap-8 items-end">
            <p className="md:col-span-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
              § 03 · O custo
            </p>
            <h2 className="md:col-span-9 font-headline text-3xl sm:text-4xl md:text-6xl font-bold text-primary leading-[0.95]">
              Descarte ruim
              <span className="block italic font-medium text-foreground">
                custa caro.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-10 md:gap-x-12 md:gap-y-14">
            <LightStat number="R$ 120bi" label="perda anual no Brasil" source="EMBRAPA, 2025" />
            <LightStat number="R$ 90bi" label="custos extras de saúde" source="ABREMA, 2025" />
            <LightStat number="344k" label="internações SUS/ano por saneamento" source="Trata Brasil" />
            <LightStat number="4,5%" label="é o que o Brasil recicla (potencial: 33,6%)" source="EMBRAPA, 2025" />
          </div>
        </div>
      </section>

      {/* INCENTIVOS */}
      <section className="bg-amber-accent/10 border-y border-amber-accent/30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-24 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-12 gap-4 md:gap-8 items-end">
            <p className="md:col-span-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-primary">
              § 04 · Os incentivos
            </p>
            <h2 className="md:col-span-9 font-headline text-3xl sm:text-4xl md:text-6xl font-bold text-primary leading-[0.95]">
              Mecanismos legais
              <span className="block italic font-medium text-foreground">
                já existem.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10">
            <LightStat number="5–20%" label="desconto IPTU Verde Manaus" source="PL 128/2025 · CMM" />
            <LightStat number="R$ 2mi" label="em créditos Ecoenel em 2025" source="Enel, 2025" />
            <LightStat number="R$ 530mi" label="aprovados na LIR" source="Câmara, 2025" />
          </div>

          <p className="font-headline text-xl md:text-3xl italic font-medium text-foreground/85 max-w-3xl leading-snug pt-8 border-t border-amber-accent/30">
            “O incentivo existe. A barreira é{" "}
            <span className="text-primary not-italic font-bold">a comprovação</span>.
            É aí que entramos.”
          </p>
        </div>
      </section>
    </>
  );
}

function BigStat({
  value,
  label,
  source,
  unit,
  accent = "primary",
  span = "",
}: {
  value: string;
  label: string;
  source: string;
  unit?: string;
  accent?: "primary" | "amber";
  span?: string;
}) {
  const color = accent === "amber" ? "text-amber-accent" : "text-primary";
  return (
    <div className={`space-y-2 ${span}`}>
      <div className="flex items-baseline gap-1">
        <p className={`font-stat text-5xl sm:text-6xl md:text-7xl ${color} tabular-nums leading-none`}>
          {value}
        </p>
        {unit && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      <p className="text-sm md:text-base text-foreground/85 leading-snug">
        {label}
      </p>
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
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
    <div className="space-y-3">
      <div className="flex items-baseline gap-1">
        <p className="font-stat text-4xl sm:text-5xl md:text-7xl text-background tabular-nums leading-none">
          {number}
        </p>
        {unit && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-background/60">
            {unit}
          </span>
        )}
      </div>
      <div className="pl-3 border-l-2 border-amber-accent space-y-1.5">
        <p className="text-sm md:text-base text-background/85 leading-snug">
          {label}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-background/45">
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
    <div className="space-y-3">
      <p className="font-stat text-4xl sm:text-5xl md:text-7xl text-primary tabular-nums leading-none">
        {number}
      </p>
      <div className="pl-3 border-l-2 border-amber-accent space-y-1.5">
        <p className="text-sm md:text-base text-foreground/85 leading-snug">{label}</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
          {source}
        </p>
      </div>
    </div>
  );
}
