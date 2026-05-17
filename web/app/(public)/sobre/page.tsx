export const dynamic = "force-dynamic";

export default function SobrePage() {
  return (
    <div className="bg-grain">
      <article className="max-w-3xl mx-auto px-6 py-24 md:py-32 space-y-24">
        <header className="space-y-6 anim-editorial">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
            <span className="inline-block w-8 h-px bg-amber-accent" />
            <span>§ Manifesto</span>
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary leading-[0.92]">
            Amazonas
            <span className="block italic font-medium text-foreground">Recicla.</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 leading-snug max-w-xl font-medium">
            Carteira ambiental digital com comprovação{" "}
            <em className="font-headline italic text-amber-accent not-italic">auditável</em>{" "}
            de descarte para acesso a incentivos legais.
          </p>
        </header>

        <ChapterDivider chapter="01" title="O problema" />

        <Section>
          <Lead>
            A Amazônia brasileira enfrenta uma crise severa na gestão de resíduos sólidos.
          </Lead>
          <p>
            Segundo o IBGE 2024, <Highlight>91,9% dos municípios do Amazonas</Highlight> ainda usam lixões como destino final — o pior índice do país.
          </p>
          <p>
            Esse cenário se agrava no impacto hídrico: os rios amazônicos recebem anualmente cerca de <Highlight>182 mil toneladas de plástico</Highlight>, tornando a bacia amazônica a segunda mais poluída do mundo. <strong>98% das espécies de peixes</strong> analisadas contêm microplásticos em seu sistema (Oceana Brasil 2024).
          </p>
          <PullQuote>
            O Brasil recicla apenas 4,5% a 8,3% dos resíduos urbanos — muito abaixo do potencial estimado de 33,6%. Perdas anuais somam R$ 120 bilhões.
            <PullQuoteSource>EMBRAPA · 2025</PullQuoteSource>
          </PullQuote>
        </Section>

        <ChapterDivider chapter="02" title="A barreira é comportamental" />

        <Section>
          <Lead>Não falta lei. Falta engajamento — e a capacidade de comprovar.</Lead>
          <p>
            Mesmo com marcos legais como a <Highlight>Lei de Incentivo à Reciclagem (Lei nº 14.260/2021)</Highlight>, o <Highlight>IPTU Verde de Manaus (PL nº 128/2025)</Highlight> e programas privados como o Ecoenel, a principal barreira identificada é a falta de engajamento da população.
          </p>
          <p>
            Há um abismo entre a intenção de reciclar e a ação efetiva. Existe também um obstáculo concreto: o cidadão comum frequentemente não dispõe de meios para <em>comprovar</em>, de forma auditável, que realizou o descarte correto. Sem prova técnica, acessar descontos no IPTU permanece burocrático e inacessível para a maioria.
          </p>
        </Section>

        <ChapterDivider chapter="03" title="A solução" />

        <Section>
          <Lead>Tornamos cada descarte uma prova técnica.</Lead>
          <p>
            O <strong>Amazonas Recicla</strong> propõe um protótipo de lixeira inteligente com separação automática de resíduos integrada a um sistema de gamificação digital, capaz de gerar métricas auditáveis que viabilizem o acesso a incentivos financeiros.
          </p>
          <p>
            A interface usa <Highlight>QR Code</Highlight> exibido em uma tela acoplada à lixeira. O usuário lê o código pelo celular e, autenticado, vê os pontos creditados em tempo real. A classificação física do material por <strong>visão computacional (ESP32-CAM)</strong> garante a destinação correta antes do crédito.
          </p>
        </Section>

        <ChapterDivider chapter="04" title="Objetivos" />

        <ol className="space-y-8 list-none anim-editorial">
          <Objective n={1}>
            Implementar classificação física de resíduos com <strong>acurácia superior a 90%</strong>.
          </Objective>
          <Objective n={2}>
            Integrar um <strong>painel digital</strong> com métricas de impacto ambiental em tempo real.
          </Objective>
          <Objective n={3}>
            Avaliar o engajamento do público via <strong>gamificação conectada ao ato físico</strong>.
          </Objective>
          <Objective n={4}>
            Demonstrar o <strong>potencial educativo</strong> em feiras científicas.
          </Objective>
          <Objective n={5}>
            Estabelecer um sistema de <strong>benefícios verificáveis</strong> via comprovação técnica para acesso a IPTU Verde e incentivos vigentes.
          </Objective>
        </ol>
      </article>
    </div>
  );
}

function ChapterDivider({ chapter, title }: { chapter: string; title: string }) {
  return (
    <div className="grid md:grid-cols-12 gap-4 items-baseline border-b border-primary/15 pb-4 anim-editorial">
      <p className="md:col-span-3 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
        Cap. {chapter}
      </p>
      <h2 className="md:col-span-9 font-headline text-3xl md:text-5xl font-bold text-primary leading-tight">
        {title}
      </h2>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-6 text-lg md:text-xl text-foreground/85 leading-relaxed max-w-2xl anim-editorial">
      {children}
    </section>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-headline text-2xl md:text-3xl font-medium text-foreground italic leading-snug">
      {children}
    </p>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-semibold text-primary bg-amber-accent/20 px-1 py-0.5 -mx-0.5">
      {children}
    </span>
  );
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-amber-accent pl-6 my-10 py-2">
      <p className="font-headline text-2xl md:text-3xl italic font-medium text-foreground/90 leading-snug">
        “{children}”
      </p>
    </blockquote>
  );
}

function PullQuoteSource({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-[10px] not-italic uppercase tracking-[0.25em] text-muted-foreground mt-4">
      {children}
    </span>
  );
}

function Objective({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-6 items-baseline">
      <span className="font-stat text-4xl md:text-5xl text-amber-accent tabular-nums flex-shrink-0 w-12">
        {n.toString().padStart(2, "0")}
      </span>
      <p className="flex-1 text-base md:text-lg text-foreground/85 leading-relaxed">
        {children}
      </p>
    </li>
  );
}
