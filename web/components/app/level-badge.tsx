import { levelForLifetimePoints, type Level } from "@/lib/domain/levels";
import { Badge } from "@/components/ui/badge";
import { Sprout, Leaf, TreePine, Trees } from "lucide-react";

const ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: Sprout,
  2: Sprout,
  3: Leaf,
  4: TreePine,
  5: Trees,
};

export interface LevelBadgeProps {
  level?: Level;
  lifetimePointsEarned?: number;
}

export function LevelBadge({ level, lifetimePointsEarned }: LevelBadgeProps) {
  const resolved =
    level ?? (lifetimePointsEarned !== undefined
      ? levelForLifetimePoints(lifetimePointsEarned)
      : null);

  if (!resolved) return null;

  const Icon = ICONS[resolved.id] ?? Sprout;

  return (
    <Badge
      variant="secondary"
      className="font-mono uppercase tracking-wider text-[10px] gap-1.5"
    >
      <Icon className="h-3 w-3" strokeWidth={2.2} />
      {resolved.name}
    </Badge>
  );
}
