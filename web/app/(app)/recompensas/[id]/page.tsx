import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { rewards, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { redeemRewardAction } from "@/lib/actions/redeem-reward";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { canAfford } from "@/lib/domain/rewards";

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

  const affordable = canAfford(profile?.totalPoints ?? 0, reward.costPoints);

  async function handleRedeem() {
    "use server";
    const result = await redeemRewardAction(id);
    if (!result.ok) {
      throw new Error(result.error);
    }
  }

  return (
    <div className="p-6 space-y-5">
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
          <span className="font-display text-lg">
            {profile?.totalPoints ?? 0} pts
          </span>
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

      <form action={handleRedeem}>
        <Button
          type="submit"
          size="lg"
          disabled={!affordable}
          className="w-full font-mono uppercase tracking-wider"
        >
          {affordable
            ? "Resgatar agora"
            : `Faltam ${reward.costPoints - (profile?.totalPoints ?? 0)} pts`}
        </Button>
      </form>
    </div>
  );
}
