"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Slide {
  title: string;
  body: string;
  source?: string;
}

const SLIDES: Slide[] = [
  {
    title: "91,9% dos municípios do Amazonas ainda usam lixões",
    body: "O estado lidera o ranking negativo nacional segundo a Pesquisa Nacional de Saneamento Básico do IBGE 2024.",
    source: "IBGE 2024",
  },
  {
    title: "182 mil toneladas de plástico vão pros rios da Amazônia todo ano",
    body: "A bacia amazônica é a segunda mais poluída do mundo. 98% das espécies de peixes analisadas contêm microplásticos.",
    source: "UFPA / Oceana Brasil",
  },
  {
    title: "O Brasil recicla apenas 4,5% a 8,3% dos resíduos urbanos",
    body: "Muito abaixo do potencial estimado de 33,6%. As perdas anuais somam R$ 120 bilhões.",
    source: "EMBRAPA 2025",
  },
  {
    title: "IPTU Verde de Manaus já garante até 20% de desconto",
    body: "O Projeto de Lei nº 128/2025 oferece descontos para imóveis que adotam práticas sustentáveis. Amazonas Recicla emite os comprovantes auditáveis.",
    source: "Câmara Municipal de Manaus 2025",
  },
];

const SLIDE_DURATION_MS = 7000;

export function ShowcaseCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full max-w-2xl space-y-6 text-center">
      <div className="relative min-h-[260px]">
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 flex flex-col justify-center gap-4 transition-opacity duration-700",
              i === index ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <h2 className="font-display text-4xl font-bold text-primary leading-tight">
              {slide.title}
            </h2>
            <p className="text-xl text-muted-foreground">{slide.body}</p>
            {slide.source && (
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground opacity-60">
                Fonte: {slide.source}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-8 bg-primary" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}
