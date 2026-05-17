import Link from "next/link";
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
      {/* ============================================================
       * HERO — editorial, asymmetric, type-driven
       * ============================================================ */}
      <section className="relative bg-mesh-eco bg-grain overflow-hidden border-b border-border">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="grid md:grid-cols-12 gap-x-8 gap-y-10">
            <div className="md:col-span-7 space-y-8 anim-editorial">
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                <span className="inline-block w-8 h-px bg-amber-accent" />
                <span>Inov@tech · FAMETRO 2026</span>
              </div>

              <h1 className="font-headline text-[15vw] md:text-[9rem] font-bold text-primary leading-[0.85]">
                Recicle.
                <span className="block italic font-medium text-amber-accent">
                  Receba.
                </span>
                <span className="block">Comprove.</span>
              </h1>
            </div>

            <div className="md:col-span-5 md:pl-8 md:border-l md:border-primary/20 space-y-6 anim-editorial anim-editorial-delay-2">
              <p className="text-xl md:text-2xl text-foreground/85 leading-snug font-medium">
                Uma lixeira que <em className="font-headline italic">enxerga</em>, conta e
                comprova cada descarte — para destravar o IPTU Verde,
                créditos Ecoenel e benefícios reais.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 font-mono text-xs uppercase tracking-[0.2em] border-2 border-primary hover:bg-background hover:text-primary transition-colors group"
                >
                  {primaryLabel}
                  <span className="inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/sobre"
                  className="inline-flex items-center gap-2 px-6 py-3.5 font-mono text-xs uppercase tracking-[0.2em] border-2 border-primary/40 text-primary hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  Como funciona
                </Link>
              </div>

              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-primary/15">
                <MiniMetric value="75pts" label="Plástico" />
                <MiniMetric value="100pts" label="Metal · Vidro" />
                <MiniMetric value="50pts" label="Papel" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 anim-editorial anim-editorial-delay-4">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60">
            <span className="block w-px h-4 bg-current animate-pulse" />
            <span>Role para conhecer o problema</span>
          </div>
        </div>
      </section>

      {/* ============================================================
       * PROBLEM — editorial stats, oversized type
       * ============================================================ */}
      <section className="bg-foreground text-background relative overflow-hidden bg-grain">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 space-y-16">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
                § 01 — o problema
              </p>
            </div>
            <div className="md:col-span-9">
              <h2 className="font-headline text-4xl md:text-6xl font-bold leading-[0.95]">
                A Amazônia tem
                <span className="block italic font-medium text-amber-accent">
                  a pior gestão
                </span>
                de resíduos do Brasil.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            <ProblemStat
              number="91,9%"
              label="dos municípios do Amazonas ainda usam lixões a céu aberto"
              source="IBGE · Pesquisa Nacional de Saneamento Básico, 2024"
            />
            <ProblemStat
              number="182 k"
              label="toneladas de plástico despejadas nos rios amazônicos por ano"
              source="UFPA · Oceana Brasil, 2024"
              unit="ton"
            />
            <ProblemStat
              number="4,5–8%"
              label="é tudo que o Brasil recicla — o potencial é de 33,6%"
              source="EMBRAPA, 2025"
            />
            <ProblemStat
              number="R$ 120 bi"
              label="é a perda anual estimada por descarte inadequado"
              source="EMBRAPA, 2025"
            />
          </div>
        </div>
      </section>

      {/* ============================================================
       * HOW IT WORKS — magazine-style 3 steps
       * ============================================================ */}
      <section className="bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 space-y-16">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
                § 02 — como funciona
              </p>
            </div>
            <div className="md:col-span-9">
              <h2 className="font-headline text-4xl md:text-6xl font-bold text-primary leading-[0.95]">
                Três passos.
                <span className="block italic font-medium text-foreground">
                  Sem complicação.
                </span>
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-6">
            <Step
              n="01"
              title="Escaneie o QR"
              description="Aponte a câmera do celular para a lixeira inteligente e faça login com sua conta Google. A sessão começa por você."
            />
            <Step
              n="02"
              title="Descarte"
              description="Coloque o resíduo na gaveta. A ESP32-CAM identifica automaticamente o material e direciona pro compartimento certo."
            />
            <Step
              n="03"
              title="Receba"
              description="Pontos creditados em tempo real. Troque por IPTU Verde, créditos de energia, brindes — ou veja o comprovante auditável."
            />
          </div>

          <div className="border-t border-primary/15 pt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Cada descarte produz prova técnica · auditável · acessível
            </p>
            <Link
              href="/dados"
              className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary link-underline"
            >
              Ver impacto em tempo real →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
       * CTA FINAL — full bleed dramático
       * ============================================================ */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-grain pointer-events-none opacity-50" />
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center space-y-8 relative">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
            § 03 — venha conhecer
          </p>
          <h2 className="font-headline text-5xl md:text-7xl font-bold leading-[0.9]">
            Faça parte da
            <span className="block italic font-medium text-amber-accent">
              Inov@tech 2026
            </span>
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-snug">
            Visite o estande da FAMETRO. Escaneie o QR. Veja como o descarte digital pode reformar a economia circular da Amazônia.
          </p>
          <div className="pt-4">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 bg-amber-accent text-ink px-8 py-4 font-mono text-xs uppercase tracking-[0.2em] border-2 border-amber-accent hover:bg-transparent hover:text-amber-accent transition-colors group"
            >
              {isAuthenticated ? "Abrir meu app" : "Começar agora"}
              <span className="inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-headline text-lg font-bold text-primary tabular-nums">
        {value}
      </p>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
        {label}
      </p>
    </div>
  );
}

function ProblemStat({
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
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-background/50">
          {source}
        </p>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  description,
}: {
  n: string;
  title: string;
  description: string;
}) {
  return (
    <article className="space-y-5">
      <p className="font-stat text-[6rem] text-amber-accent tabular-nums leading-none">
        {n}
      </p>
      <div className="space-y-3 pl-1">
        <h3 className="font-headline text-2xl font-bold text-primary">
          {title}
        </h3>
        <p className="text-sm text-foreground/75 leading-relaxed max-w-xs">
          {description}
        </p>
      </div>
    </article>
  );
}
