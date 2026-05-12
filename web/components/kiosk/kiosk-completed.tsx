import { MaterialIcon } from "@/components/app/material-icon";
import { MATERIAL_LABELS, type Material } from "@/lib/domain/materials";
import { CheckCircle2 } from "lucide-react";

export interface KioskCompletedProps {
  userDisplayName: string;
  material: Material;
  pointsValue: number;
}

export function KioskCompleted({
  userDisplayName,
  material,
  pointsValue,
}: KioskCompletedProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-12 text-center bg-gradient-to-b from-background via-background to-accent/10">
      <div className="rounded-full bg-accent p-12">
        <CheckCircle2 className="h-32 w-32 text-accent-foreground" />
      </div>

      <h1 className="font-display text-7xl font-bold text-primary">
        Obrigado por reciclar! 🌱
      </h1>

      <div className="flex items-center gap-3">
        <MaterialIcon material={material} size={48} />
        <span className="font-display text-3xl text-foreground">
          {MATERIAL_LABELS[material]}
        </span>
      </div>

      <p className="font-display text-9xl font-bold text-accent-foreground tabular-nums">
        +{pointsValue}
        <span className="text-4xl font-normal ml-2">pts</span>
      </p>

      <p className="font-display text-2xl text-muted-foreground">
        creditados para{" "}
        <span className="font-semibold text-foreground">{userDisplayName}</span>
      </p>
    </div>
  );
}
