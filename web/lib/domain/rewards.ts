export type RewardType = "digital_badge" | "physical_item" | "conversion";

export interface RewardSeed {
  title: string;
  description: string;
  imageUrl: string | null;
  costPoints: number;
  type: RewardType;
  stock: number | null;
  metadata: Record<string, unknown> | null;
}

export const INITIAL_REWARDS: ReadonlyArray<RewardSeed> = [
  {
    title: "Selo Reciclador",
    description: "Reconhecimento digital pela sua contribuição ecológica ativa.",
    imageUrl: null,
    costPoints: 100,
    type: "digital_badge",
    stock: null,
    metadata: null,
  },
  {
    title: "Copo Sustentável",
    description: "Copo reutilizável feito de materiais 100% recicláveis.",
    imageUrl: null,
    costPoints: 300,
    type: "physical_item",
    stock: 20,
    metadata: null,
  },
  {
    title: "Brinde Ecológico",
    description: "Kit-surpresa dos parceiros apoiadores do projeto.",
    imageUrl: null,
    costPoints: 500,
    type: "physical_item",
    stock: 10,
    metadata: null,
  },
  {
    title: "IPTU Verde Manaus 5%",
    description: "Desconto de 5% no IPTU 2027 — programa PL 128/2025.",
    imageUrl: null,
    costPoints: 1000,
    type: "conversion",
    stock: null,
    metadata: { program: "iptu_verde_manaus", percent: 5 },
  },
];

export function canAfford(totalPoints: number, costPoints: number): boolean {
  return totalPoints >= costPoints;
}
