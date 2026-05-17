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
  const primaryLabel = isAuthenticated ? "Abrir app" : "Entrar com Google";

  return (
    <>
      {/* HERO */}
      <section className="relative bg-mesh-eco bg-grain overflow-hidden border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-14 md:pt-20 md:pb-24">
          <div className="grid md:grid-cols-12 gap-x-8 gap-y-8">
            <div className="md:col-span-7 space-y-6 anim-editorial">
              <div className="flex items-center gap-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <span className="inline-block w-6 h-px bg-amber-accent" />
                <span>Inov@tech · FAMETRO 2026</span>
              </div>

              <h1 className="font-headline font-bold text-primary leading-[0.88]">
                <span className="block text-5xl sm:text-6xl md:text-8xl">
                  Recicle.
                </span>
                <span className="block text-5xl sm:text-6xl md:text-8xl italic font-medium text-amber-accent">
                  Receba.
                </span>
                <span className="block text-5xl sm:text-6xl md:text-8xl">
                  Comprove.
                </span>
              </h1>
            </div>

            <div className="md:col-span-5 md:pl-6 md:border-l md:border-primary/20 space-y-5 anim-editorial anim-editorial-delay-2">
              <p className="text-base md:text-xl text-foreground/85 leading-snug font-medium max-w-md">
                Uma lixeira que <em className="font-headline italic">enxerga</em>, conta e comprova cada descarte. Pontos viram IPTU Verde, créditos Ecoenel, prêmios.
              </p>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] border-2 border-primary hover:bg-foreground hover:border-foreground transition-colors group"
                >
                  {primaryLabel}
                  <span className="inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/sobre"
                  className="inline-flex items-center px-5 py-3 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] border-2 border-primary/40 text-primary hover:border-primary transition-colors"
                >
                  Como funciona
                </Link>
              </div>

              <div className="pt-5 grid grid-cols-3 gap-3 border-t border-primary/15">
                <MiniMetric value="75" label="Plástico" />
                <MiniMetric value="100" label="Metal/Vidro" />
                <MiniMetric value="50" label="Papel" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="bg-foreground text-background bg-grain">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-24 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-12 gap-4 md:gap-8 items-end">
            <p className="md:col-span-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
              § 01 · O problema
            </p>
            <h2 className="md:col-span-9 font-headline text-3xl sm:text-4xl md:text-6xl font-bold leading-[0.95]">
              A Amazônia tem
              <span className="block italic font-medium text-amber-accent">
                a pior gestão
              </span>
              de resíduos do Brasil.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-14">
            <ProblemStat number="91,9%" label="dos municípios usam lixões no AM" source="IBGE, 2024" />
            <ProblemStat number="182k" unit="t" label="de plástico nos rios/ano" source="UFPA, 2024" />
            <ProblemStat number="4,5%" label="é tudo que o Brasil recicla" source="EMBRAPA, 2025" />
            <ProblemStat number="120bi" unit="R$" label="de perdas anuais" source="EMBRAPA, 2025" />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-24 space-y-10 md:space-y-14">
          <div className="grid md:grid-cols-12 gap-4 md:gap-8 items-end">
            <p className="md:col-span-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
              § 02 · Como funciona
            </p>
            <h2 className="md:col-span-9 font-headline text-3xl sm:text-4xl md:text-6xl font-bold text-primary leading-[0.95]">
              Três passos.
              <span className="block italic font-medium text-foreground">
                Sem complicação.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            <Step n="01" title="Escaneie o QR" description="Aponte a câmera para a lixeira inteligente e faça login com Google." />
            <Step n="02" title="Descarte" description="Coloque o resíduo na gaveta. A ESP32-CAM identifica e direciona pro compartimento certo." />
            <Step n="03" title="Receba" description="Pontos creditados em tempo real. Troque por IPTU Verde, energia ou brindes." />
          </div>

          <div className="border-t border-primary/15 pt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Prova auditável a cada descarte
            </p>
            <Link
              href="/dados"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary link-underline"
            >
              Ver impacto →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-grain pointer-events-none opacity-40" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center space-y-6 relative">
          <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
            § 03 · Venha conhecer
          </p>
          <h2 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold leading-[0.95]">
            Faça parte da
            <span className="block italic font-medium text-amber-accent">
              Inov@tech 2026.
            </span>
          </h2>
          <p className="text-base md:text-lg text-primary-foreground/80 max-w-xl mx-auto leading-snug">
            Visite o estande da FAMETRO. Escaneie o QR. Veja o descarte digital remodelar a economia circular amazônica.
          </p>
          <div className="pt-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 bg-amber-accent text-ink px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] border-2 border-amber-accent hover:bg-transparent hover:text-amber-accent transition-colors group"
            >
              {isAuthenticated ? "Abrir app" : "Começar agora"}
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
      <p className="font-headline text-lg md:text-xl font-bold text-primary tabular-nums leading-none">
        {value}
        <span className="font-mono text-[9px] uppercase ml-1 text-muted-foreground">pts</span>
      </p>
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
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
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-background/45">
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
    <article className="space-y-3 md:space-y-4">
      <p className="font-stat text-5xl md:text-7xl text-amber-accent tabular-nums leading-none">
        {n}
      </p>
      <div className="space-y-1.5">
        <h3 className="font-headline text-xl md:text-2xl font-bold text-primary">
          {title}
        </h3>
        <p className="text-sm text-foreground/70 leading-relaxed max-w-xs">
          {description}
        </p>
      </div>
    </article>
  );
}
