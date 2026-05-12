import { progressToNextLevel } from "@/lib/domain/levels";
import { Progress } from "@/components/ui/progress";

export interface PointsBalanceProps {
  totalPoints: number;
  lifetimePointsEarned: number;
}

export function PointsBalance({
  totalPoints,
  lifetimePointsEarned,
}: PointsBalanceProps) {
  const { current, next, pointsToNext, percentToNext } =
    progressToNextLevel(lifetimePointsEarned);

  return (
    <div className="rounded-2xl bg-primary text-primary-foreground p-6 space-y-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
            Saldo
          </p>
          <p className="font-display text-4xl font-bold leading-none">
            {totalPoints.toLocaleString("pt-BR")}
            <span className="text-base font-normal opacity-80 ml-1">pts</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
            Nível {current.id}
          </p>
          <p className="font-display text-xl font-semibold leading-tight">
            {current.name}
          </p>
        </div>
      </div>

      {next && (
        <div className="space-y-1.5">
          <Progress
            value={percentToNext}
            className="h-2 bg-primary-foreground/20"
          />
          <p className="text-xs opacity-80">
            Faltam {pointsToNext.toLocaleString("pt-BR")} pts para{" "}
            <span className="font-semibold">{next.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}
