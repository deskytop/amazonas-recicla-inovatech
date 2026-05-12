import { type Material, MATERIAL_LABELS, MATERIAL_COLORS } from "@/lib/domain/materials";

export interface MaterialIconProps {
  material: Material;
  size?: number;
  label?: boolean;
}

export function MaterialIcon({ material, size = 24, label }: MaterialIconProps) {
  const color = MATERIAL_COLORS[material];
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className="rounded-full flex items-center justify-center text-white font-mono text-[10px] font-bold uppercase"
        style={{ width: size, height: size, backgroundColor: color }}
      >
        {material[0]?.toUpperCase()}
      </span>
      {label && (
        <span className="font-medium">{MATERIAL_LABELS[material]}</span>
      )}
    </div>
  );
}
