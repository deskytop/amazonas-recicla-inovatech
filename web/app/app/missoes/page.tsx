import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles, sessions } from "@/lib/db/schema";
import { eq, and, count, gte } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { INITIAL_MISSIONS } from "@/lib/domain/missions";
import { Target, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS = {
  daily: "Diária",
  weekly: "Semanal",
  achievement: "Conquista",
} as const;

export default async function MissoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayStats] = await db
    .select({ discardsCount: count() })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, user.id),
        eq(sessions.status, "completed"),
        gte(sessions.completedAt, startOfToday),
      ),
    );

  function computeProgress(missionId: string): number {
    switch (missionId) {
      case "daily-3-discards":
        return todayStats?.discardsCount ?? 0;
      case "achievement-broto":
        return profile?.lifetimePointsEarned ?? 0;
      default:
        return 0;
    }
  }

  return (
    <div className="p-4 space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">Missões</h1>
        <p className="text-sm text-muted-foreground">
          Complete missões pra ganhar pontos extras.
        </p>
      </header>

      <ul className="space-y-3">
        {INITIAL_MISSIONS.map((mission) => {
          const progress = computeProgress(mission.id);
          const completed = progress >= mission.target;
          const percent = Math.min(100, (progress / mission.target) * 100);

          return (
            <li key={mission.id}>
              <Card className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
                        {TYPE_LABELS[mission.type]}
                      </Badge>
                      {completed && (
                        <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
                      )}
                    </div>
                    <p className="font-display font-semibold">{mission.title}</p>
                    <p className="text-xs text-muted-foreground">{mission.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-primary">+{mission.rewardPoints}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      pontos
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Progresso: {progress} / {mission.target}
                    </span>
                    {!completed && (
                      <span className="text-muted-foreground tabular-nums">
                        {percent.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <Progress value={percent} className="h-1.5" />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card className="p-4 bg-muted/30 border-dashed text-center space-y-1">
        <Target className="h-6 w-6 mx-auto text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Crédito automático de pontos em missões chega em breve.
        </p>
      </Card>
    </div>
  );
}
