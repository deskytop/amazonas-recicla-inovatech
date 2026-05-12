import { MaterialIcon } from "@/components/app/material-icon";
import { MATERIAL_LABELS, type Material } from "@/lib/domain/materials";
import { Sparkles } from "lucide-react";

export interface KioskDetectedProps {
  userDisplayName: string;
  material: Material;
  pointsValue: number;
}

export function KioskDetected({
  userDisplayName,
  material,
  pointsValue,
}: KioskDetectedProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-12 text-center">
      <Sparkles className="h-24 w-24 text-accent-foreground animate-pulse" />

      <div className="space-y-2">
        <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Material identificado
        </p>
        <h1 className="font-display text-7xl font-bold text-primary">
          {MATERIAL_LABELS[material]}
        </h1>
        <div className="flex justify-center mt-3">
          <MaterialIcon material={material} size={64} />
        </div>
      </div>

      <p className="font-display text-9xl font-bold text-accent-foreground tabular-nums">
        +{pointsValue}
        <span className="text-4xl font-normal ml-2">pts</span>
      </p>

      <p className="text-xl text-muted-foreground">
        Aguardando a lixeira finalizar o descarte de{" "}
        <span className="font-semibold text-foreground">{userDisplayName}</span>...
      </p>
    </div>
  );
}
