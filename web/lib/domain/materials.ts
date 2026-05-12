export const MATERIAL_POINTS = {
  plastic: 75,
  metal: 100,
  glass: 100,
  paper: 50,
} as const;

export type Material = keyof typeof MATERIAL_POINTS;

export function pointsForMaterial(material: Material): number {
  return MATERIAL_POINTS[material];
}

export function isValidMaterial(value: string): value is Material {
  return value in MATERIAL_POINTS;
}

export const MATERIAL_LABELS: Record<Material, string> = {
  plastic: "Plástico",
  metal: "Metal",
  glass: "Vidro",
  paper: "Papel",
};

export const MATERIAL_COLORS: Record<Material, string> = {
  plastic: "#FFB700",
  metal: "#7B7B7B",
  glass: "#3FA9D6",
  paper: "#3478C2",
};
