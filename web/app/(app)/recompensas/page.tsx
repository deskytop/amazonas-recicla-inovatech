import { db } from "@/lib/db/client";
import { rewards, profiles } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { canAfford } from "@/lib/domain/rewards";
import { Lock, Gift } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RecompensasPage() {
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

  const items = await db
    .select()
    .from(rewards)
    .where(eq(rewards.active, true))
    .orderBy(asc(rewards.costPoints));

  return (
    <div className="p-4 space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Recompensas
        </h1>
        <p className="text-sm text-muted-foreground">
          Você tem <strong>{profile?.totalPoints ?? 0}</strong> pts disponíveis.
        </p>
      </header>

      <ul className="space-y-3">
        {items.map((reward) => {
          const affordable = canAfford(profile?.totalPoints ?? 0, reward.costPoints);
          return (
            <li key={reward.id}>
              <Link
                href={`/app/recompensas/${reward.id}`}
                className={
                  affordable
                    ? "block"
                    : "block pointer-events-none opacity-60"
                }
              >
                <Card className="p-4 flex items-center gap-4">
                  <div className="rounded-xl bg-muted h-16 w-16 flex items-center justify-center">
                    {affordable ? (
                      <Gift className="h-7 w-7 text-primary" />
                    ) : (
                      <Lock className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold truncate">
                      {reward.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {reward.description}
                    </p>
                  </div>
                  <Badge variant={affordable ? "default" : "secondary"} className="font-mono">
                    {reward.costPoints} pts
                  </Badge>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
