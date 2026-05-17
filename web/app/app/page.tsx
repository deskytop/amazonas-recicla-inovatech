import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles, sessions } from "@/lib/db/schema";
import { eq, and, count, sum, gte } from "drizzle-orm";
import { PointsBalance } from "@/components/app/points-balance";
import { OnboardingBanner } from "@/components/app/onboarding-banner";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ScanLine, History, Gift } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const [monthStats] = await db
    .select({
      sessionsCount: count(),
      pointsSum: sum(sessions.pointsValue),
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, user.id),
        eq(sessions.status, "completed"),
        gte(sessions.completedAt, firstOfMonth),
      ),
    );

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-destructive">Perfil não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Olá,
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {profile.displayName}
        </h1>
      </header>

      {profile.lifetimePointsEarned === 0 && <OnboardingBanner />}

      <PointsBalance
        totalPoints={profile.totalPoints}
        lifetimePointsEarned={profile.lifetimePointsEarned}
      />

      <section className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Descartes no mês
          </p>
          <p className="font-display text-2xl font-bold mt-1">
            {monthStats?.sessionsCount ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Pontos no mês
          </p>
          <p className="font-display text-2xl font-bold mt-1">
            {monthStats?.pointsSum ?? 0}
          </p>
        </Card>
      </section>

      <section className="space-y-2">
        <Link
          href="/app/escanear"
          className="flex items-center gap-3 rounded-2xl bg-accent text-accent-foreground p-4 font-semibold transition-transform active:scale-[0.98]"
        >
          <ScanLine className="h-6 w-6" />
          <span className="font-mono uppercase tracking-wider text-sm">
            Escanear QR da lixeira
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/app/recompensas"
            className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center"
          >
            <Gift className="h-5 w-5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider">
              Recompensas
            </span>
          </Link>
          <Link
            href="/app/historico"
            className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center"
          >
            <History className="h-5 w-5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider">
              Histórico
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
