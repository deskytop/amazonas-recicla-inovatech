import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles, redemptions, rewards } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LevelBadge } from "@/components/app/level-badge";
import { BadgeCard } from "@/components/app/badge-card";
import { signOutAction } from "@/lib/actions/sign-out";
import { Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
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

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-destructive">Perfil não encontrado.</p>
      </div>
    );
  }

  const badges = await db
    .select({
      redemptionId: redemptions.id,
      title: rewards.title,
      redeemedAt: redemptions.redeemedAt,
    })
    .from(redemptions)
    .innerJoin(rewards, eq(redemptions.rewardId, rewards.id))
    .where(
      and(
        eq(redemptions.userId, user.id),
        eq(rewards.type, "digital_badge"),
        eq(redemptions.status, "fulfilled"),
      ),
    )
    .orderBy(desc(redemptions.redeemedAt));

  const initials = profile.displayName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="p-4 space-y-5">
      <header className="flex flex-col items-center text-center space-y-3 pt-4">
        <Avatar className="h-20 w-20">
          {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />}
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-display text-2xl font-bold">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <LevelBadge lifetimePointsEarned={profile.lifetimePointsEarned} />
      </header>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Saldo atual
          </span>
          <span className="font-display text-lg font-semibold">{profile.totalPoints} pts</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Total acumulado
          </span>
          <span className="font-display text-lg font-semibold">
            {profile.lifetimePointsEarned} pts
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Conta criada
          </span>
          <span className="font-mono text-xs">
            {profile.createdAt.toLocaleDateString("pt-BR")}
          </span>
        </div>
      </Card>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold">Minhas conquistas</h2>
          <span className="font-mono text-xs text-muted-foreground">({badges.length})</span>
        </div>
        {badges.length === 0 ? (
          <Card className="p-6 text-center bg-muted/30 border-dashed">
            <p className="text-xs text-muted-foreground">
              Resgate badges na aba Prêmios para que apareçam aqui.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {badges.map((badge) => (
              <BadgeCard
                key={badge.redemptionId}
                title={badge.title}
                redeemedAt={badge.redeemedAt}
              />
            ))}
          </div>
        )}
      </section>

      <form action={signOutAction}>
        <Button
          type="submit"
          variant="outline"
          className="w-full font-mono uppercase tracking-wider"
        >
          Sair
        </Button>
      </form>
    </div>
  );
}
