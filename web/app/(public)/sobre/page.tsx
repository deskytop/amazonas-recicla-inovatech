export const dynamic = "force-dynamic";

export default function SobrePage() {
  return (
    <article className="max-w-2xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-14 md:space-y-20 bg-grain">
      <header className="space-y-4 anim-editorial">
        <div className="flex items-center gap-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
          <span className="inline-block w-6 h-px bg-amber-accent" />
          <span>Manifesto</span>
        </div>
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary leading-[0.92]">
          Amazonas
          <span className="block italic font-medium text-foreground">Recicla.</span>
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 leading-snug max-w-lg">
          Carteira ambiental digital com comprovação{" "}
          <em className="font-headline italic text-amber-accent not-italic font-semibold">auditável</em>{" "}
          de descarte para acesso a incentivos legais.
        </p>
      </header>

      <Chapter n="01" title="O problema">
        <Lead>A Amazônia enfrenta uma crise severa na gestão de resíduos.</Lead>
        <p>
          Segundo o IBGE 2024, <Highlight>91,9% dos municípios do Amazonas</Highlight> ainda usam lixões como destino final. É o pior índice do país.
        </p>
        <p>
          Os rios amazônicos recebem <Highlight>182 mil toneladas de plástico por ano</Highlight>, tornando a bacia a segunda mais poluída do mundo. 98% das espécies de peixes analisadas contêm microplásticos.
        </p>
        <PullQuote>
          O Brasil recicla apenas 4,5% a 8,3% dos resíduos urbanos. O potencial é de 33,6%. Perdas anuais somam R$ 120 bilhões.
          <PullQuoteSource>EMBRAPA, 2025</PullQuoteSource>
        </PullQuote>
      </Chapter>

      <Chapter n="02" title="A barreira é comportamental">
        <Lead>Não falta lei. Falta engajamento, e a capacidade de comprovar.</Lead>
        <p>
          Existem marcos legais: <Highlight>Lei nº 14.260/2021</Highlight>, <Highlight>IPTU Verde de Manaus (PL 128/2025)</Highlight>, programas privados como Ecoenel. Mesmo assim, a principal barreira é a falta de adesão da população.
        </p>
        <p>
          O cidadão comum não dispõe de meios para <em>comprovar</em>, de forma auditável, que reciclou. Sem prova técnica, acessar os descontos vira algo burocrático e inacessível.
        </p>
      </Chapter>

      <Chapter n="03" title="A solução">
        <Lead>Tornamos cada descarte uma prova técnica.</Lead>
        <p>
          O Amazonas Recicla é um protótipo de lixeira inteligente com separação automática de resíduos integrada a um sistema de gamificação digital. Ela gera métricas auditáveis que viabilizam acesso a incentivos financeiros.
        </p>
        <p>
          A interface usa <Highlight>QR Code</Highlight> exibido no tablet da lixeira. O usuário lê pelo celular, autentica, e vê os pontos creditados em tempo real. A classificação física é feita por <strong>visão computacional</strong> via ESP32-CAM antes do crédito.
        </p>
      </Chapter>

      <Chapter n="04" title="Objetivos">
        <ol className="space-y-6 list-none not-prose">
          <Objective n={1}>Classificação física com <strong>acurácia &gt; 90%</strong>.</Objective>
          <Objective n={2}>Painel digital com métricas de impacto em tempo real.</Objective>
          <Objective n={3}>Engajamento via gamificação conectada ao ato físico.</Objective>
          <Objective n={4}>Demonstração educativa em feiras científicas.</Objective>
          <Objective n={5}>Sistema de benefícios verificáveis para acesso a IPTU Verde e incentivos vigentes.</Objective>
        </ol>
      </Chapter>
    </article>
  );
}

function Chapter({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="anim-editorial space-y-6">
      <header className="grid grid-cols-12 gap-3 items-baseline border-b border-primary/15 pb-3">
        <p className="col-span-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
          Cap. {n}
        </p>
        <h2 className="col-span-9 font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-primary leading-tight">
          {title}
        </h2>
      </header>
      <div className="space-y-4 text-base md:text-lg text-foreground/85 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-headline text-xl md:text-2xl font-medium text-foreground italic leading-snug">
      {children}
    </p>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-semibold text-primary bg-amber-accent/20 px-1">
      {children}
    </span>
  );
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-amber-accent pl-5 my-6 py-1">
      <p className="font-headline text-lg md:text-2xl italic font-medium text-foreground/90 leading-snug">
        “{children}”
      </p>
    </blockquote>
  );
}

function PullQuoteSource({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-[9px] not-italic uppercase tracking-[0.22em] text-muted-foreground mt-3">
      {children}
    </span>
  );
}

function Objective({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 items-baseline">
      <span className="font-stat text-2xl md:text-3xl text-amber-accent tabular-nums flex-shrink-0 w-9">
        {n.toString().padStart(2, "0")}
      </span>
      <p className="flex-1 text-sm md:text-base text-foreground/85 leading-relaxed">
        {children}
      </p>
    </li>
  );
}
