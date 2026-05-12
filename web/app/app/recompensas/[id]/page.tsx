import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { rewards, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { canAfford } from "@/lib/domain/rewards";
import { RedeemDialog } from "@/components/app/redeem-dialog";
import { BackButton } from "@/components/app/back-button";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function RewardDetail({ params }: Params) {
  const { id } = await params;

  const [reward] = await db
    .select()
    .from(rewards)
    .where(eq(rewards.id, id))
    .limit(1);
  if (!reward || !reward.active) notFound();

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

  const balance = profile?.totalPoints ?? 0;
  const affordable = canAfford(balance, reward.costPoints);
  const missing = Math.max(0, reward.costPoints - balance);

  return (
    <div className="p-6 space-y-5">
      <BackButton href="/app/recompensas" />

      <header className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Recompensa
        </p>
        <h1 className="font-display text-3xl font-bold text-primary">
          {reward.title}
        </h1>
      </header>

      <Card className="p-5 space-y-3">
        <p className="text-muted-foreground">{reward.description}</p>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Custo
          </span>
          <span className="font-display text-2xl font-bold">
            {reward.costPoints} pts
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Seu saldo
          </span>
          <span className="font-display text-lg">{balance} pts</span>
        </div>
        {reward.stock !== null && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Estoque
            </span>
            <span className="font-mono text-sm">
              {reward.stock} restantes
            </span>
          </div>
        )}
      </Card>

      <RedeemDialog
        rewardId={reward.id}
        rewardTitle={reward.title}
        costPoints={reward.costPoints}
        rewardType={reward.type}
        affordable={affordable}
        missingPoints={missing}
      />
    </div>
  );
}
