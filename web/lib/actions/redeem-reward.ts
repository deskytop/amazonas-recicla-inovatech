"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { rewards, profiles, redemptions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { canAfford } from "@/lib/domain/rewards";

export type RedeemResult =
  | { ok: true; redemptionId: string; voucherCode: string }
  | {
      ok: false;
      error: "unauthenticated" | "reward_not_found" | "insufficient_points" | "out_of_stock";
    };

export async function redeemRewardAction(rewardId: string): Promise<RedeemResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }

  const result = await db.transaction(async (tx) => {
    const [reward] = await tx
      .select()
      .from(rewards)
      .where(eq(rewards.id, rewardId))
      .limit(1);
    if (!reward || !reward.active) {
      return { ok: false as const, error: "reward_not_found" as const };
    }
    if (reward.stock !== null && reward.stock <= 0) {
      return { ok: false as const, error: "out_of_stock" as const };
    }

    const [profile] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    if (!profile || !canAfford(profile.totalPoints, reward.costPoints)) {
      return { ok: false as const, error: "insufficient_points" as const };
    }

    await tx
      .update(profiles)
      .set({
        totalPoints: sql`${profiles.totalPoints} - ${reward.costPoints}`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    if (reward.stock !== null) {
      await tx
        .update(rewards)
        .set({ stock: sql`${rewards.stock} - 1` })
        .where(eq(rewards.id, rewardId));
    }

    const voucherCode = `AR-${rewardId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const [redemption] = await tx
      .insert(redemptions)
      .values({
        userId: user.id,
        rewardId,
        pointsSpent: reward.costPoints,
        voucherCode,
        status: reward.type === "digital_badge" ? "fulfilled" : "pending",
      })
      .returning();

    return { ok: true as const, redemptionId: redemption!.id, voucherCode };
  });

  return result;
}
