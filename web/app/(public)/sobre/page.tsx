import { Sprout, AlertTriangle, Lightbulb, Target } from "lucide-react";

export default function SobrePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">
      <header className="space-y-3 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Sobre o projeto
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary">
          Amazonas Recicla
        </h1>
        <p className="text-lg text-muted-foreground">
          Carteira ambiental digital com comprovação auditável de descarte para acesso a incentivos legais.
        </p>
      </header>

      <Section icon={AlertTriangle} title="O problema">
        <p>
          A Amazônia brasileira enfrenta uma <strong>crise severa</strong> na gestão de resíduos sólidos. Segundo o IBGE 2024, <strong>91,9% dos municípios do Amazonas ainda usam lixões</strong> como destino final — o pior índice do país.
        </p>
        <p>
          Esse cenário se agrava no impacto hídrico: os rios amazônicos recebem anualmente cerca de <strong>182 mil toneladas de plástico</strong>, tornando a bacia amazônica a <strong>segunda mais poluída do mundo</strong>. 98% das espécies de peixes analisadas contêm microplásticos em seu sistema (Oceana Brasil 2024).
        </p>
        <p>
          O Brasil recicla apenas <strong>4,5% a 8,3%</strong> dos resíduos sólidos urbanos, muito abaixo do potencial estimado de 33,6%. Perdas anuais somam <strong>R$ 120 bilhões</strong> (EMBRAPA 2025).
        </p>
      </Section>

      <Section icon={Lightbulb} title="A barreira é comportamental">
        <p>
          Mesmo com marcos legais como a <strong>Lei de Incentivo à Reciclagem (Lei nº 14.260/2021)</strong>, o <strong>IPTU Verde de Manaus (PL nº 128/2025)</strong> e programas privados como o Ecoenel, a principal barreira identificada é a <strong>falta de engajamento da população</strong>.
        </p>
        <p>
          Há um abismo entre a intenção de reciclar e a ação efetiva. Existe também um obstáculo concreto: o cidadão comum frequentemente <strong>não dispõe de meios para comprovar</strong>, de forma auditável, que realizou o descarte correto. Sem prova técnica, acessar descontos no IPTU permanece burocrático e inacessível para a maioria.
        </p>
      </Section>

      <Section icon={Sprout} title="A solução">
        <p>
          O <strong>Amazonas Recicla</strong> propõe um protótipo de lixeira inteligente com <strong>separação automática de resíduos</strong> integrada a um sistema de gamificação digital, capaz de gerar <strong>métricas auditáveis</strong> que viabilizem o acesso a incentivos financeiros.
        </p>
        <p>
          A interface usa <strong>QR Code</strong> exibido em uma tela acoplada à lixeira. O usuário lê o código pelo celular e, autenticado, vê os pontos creditados em tempo real. A classificação física do material por visão computacional (ESP32-CAM) garante a destinação correta antes do crédito.
        </p>
      </Section>

      <Section icon={Target} title="Objetivos">
        <ul className="space-y-2 list-decimal pl-5">
          <li>Implementar classificação física de resíduos com <strong>acurácia superior a 90%</strong></li>
          <li>Integrar um <strong>painel digital</strong> com métricas de impacto ambiental em tempo real</li>
          <li>Avaliar o engajamento do público via <strong>gamificação conectada ao ato físico</strong></li>
          <li>Demonstrar o <strong>potencial educativo</strong> em feiras científicas</li>
          <li>Estabelecer um sistema de <strong>benefícios verificáveis</strong> via comprovação técnica para acesso a IPTU Verde e incentivos vigentes</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 h-10 w-10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-3 text-foreground leading-relaxed pl-13">{children}</div>
    </section>
  );
}
