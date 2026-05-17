import Link from "next/link";
import { ArrowRight, Recycle, Smartphone, Award, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  const primaryHref = isAuthenticated ? "/app" : "/login";
  const primaryLabel = isAuthenticated ? "Abrir meu app" : "Entrar com Google";

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-accent/5">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Carteira ambiental digital
            </p>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-primary leading-[1.05]">
              Recicle. Receba.
              <br />
              <span className="text-accent-foreground">Comprove.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Lixeira inteligente com separação automática e gamificação. Cada descarte vira{" "}
              <strong>prova auditável</strong> para acessar IPTU Verde, créditos Ecoenel e benefícios reais.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-mono uppercase tracking-wider text-sm hover:bg-primary/90 transition-colors"
              >
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sobre"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-mono uppercase tracking-wider text-sm hover:bg-card transition-colors"
              >
                Como funciona
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/10 via-accent/10 to-background rounded-3xl border border-border p-8 flex items-center justify-center">
              <Recycle className="h-48 w-48 text-primary/40" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              O problema
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground max-w-2xl mx-auto">
              A Amazônia tem a pior gestão de resíduos do Brasil
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <ProblemStat number="91,9%" label="Municípios do Amazonas usam lixões" source="IBGE 2024" />
            <ProblemStat number="182k" label="Toneladas de plástico nos rios/ano" source="UFPA 2024" />
            <ProblemStat number="4,5–8,3%" label="Taxa real de reciclagem no Brasil" source="EMBRAPA 2025" />
            <ProblemStat number="R$ 120 bi" label="Perdas anuais por descarte ruim" source="EMBRAPA 2025" />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20 space-y-12">
        <div className="text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Como funciona
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Três passos. Sem complicação.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Step
            n="1"
            icon={Smartphone}
            title="Escaneie o QR"
            description="Aponte a câmera do celular para a lixeira inteligente e faça login com sua conta Google."
          />
          <Step
            n="2"
            icon={Trash2}
            title="Descarte"
            description="Coloque o resíduo na gaveta. A lixeira identifica automaticamente o material com visão computacional."
          />
          <Step
            n="3"
            icon={Award}
            title="Receba"
            description="Pontos creditados em tempo real. Troque por IPTU Verde, créditos de energia ou prêmios físicos."
          />
        </div>

        <div className="text-center pt-4">
          <Link
            href="/dados"
            className="inline-flex items-center gap-2 text-primary font-mono uppercase tracking-wider text-sm hover:underline"
          >
            Ver impacto em tempo real <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-5">
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">
            Faça parte da feira Inov@tech 2026
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Visite o estande da FAMETRO, escaneie o QR e veja como o descarte digital pode reformar a economia circular da Amazônia.
          </p>
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 font-mono uppercase tracking-wider text-sm hover:bg-accent/90 transition-colors"
          >
            {isAuthenticated ? "Abrir meu app" : "Começar agora"} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function ProblemStat({
  number,
  label,
  source,
}: {
  number: string;
  label: string;
  source: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-2">
      <p className="font-display text-3xl font-bold text-primary leading-none">{number}</p>
      <p className="text-sm text-foreground leading-tight">{label}</p>
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        Fonte: {source}
      </p>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  description,
}: {
  n: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-primary text-primary-foreground h-9 w-9 flex items-center justify-center font-mono font-bold">
          {n}
        </span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
