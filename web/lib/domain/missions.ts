export interface MissionSeed {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  type: "daily" | "weekly" | "achievement";
  target: number;
}

export const INITIAL_MISSIONS: ReadonlyArray<MissionSeed> = [
  {
    id: "daily-3-discards",
    title: "Reciclador diário",
    description: "Faça 3 descartes hoje.",
    rewardPoints: 50,
    type: "daily",
    target: 3,
  },
  {
    id: "weekly-all-materials",
    title: "Coleção da semana",
    description: "Recicle ao menos 1 plástico, 1 metal, 1 vidro e 1 papel nesta semana.",
    rewardPoints: 200,
    type: "weekly",
    target: 4,
  },
  {
    id: "achievement-first-resgate",
    title: "Primeiro resgate",
    description: "Resgate sua primeira recompensa na aba Prêmios.",
    rewardPoints: 25,
    type: "achievement",
    target: 1,
  },
  {
    id: "achievement-broto",
    title: "De Semente a Broto",
    description: "Acumule 500 pontos totais.",
    rewardPoints: 100,
    type: "achievement",
    target: 500,
  },
];
