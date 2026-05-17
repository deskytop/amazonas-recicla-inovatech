import { db } from "@/lib/db/client";
import { rewards, profiles } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { canAfford } from "@/lib/domain/rewards";
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

  const balance = profile?.totalPoints ?? 0;

  return (
    <div className="px-4 py-5 space-y-5">
      <header className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-accent">
          Catálogo
        </p>
        <h1 className="font-headline text-3xl font-bold text-primary leading-tight">
          Recompensas
        </h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-stat text-base text-foreground tabular-nums">{balance}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] ml-1">pts disponíveis</span>
        </p>
      </header>

      <ul className="divide-y divide-border border-y border-border">
        {items.map((reward, idx) => {
          const affordable = canAfford(balance, reward.costPoints);
          const missing = Math.max(0, reward.costPoints - balance);
          return (
            <li key={reward.id}>
              <Link
                href={affordable ? `/app/recompensas/${reward.id}` : "#"}
                aria-disabled={!affordable}
                tabIndex={affordable ? 0 : -1}
                className={`block py-4 transition-colors group ${
                  affordable ? "hover:bg-muted/40" : "opacity-55 pointer-events-none"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground w-6">
                    {(idx + 1).toString().padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="font-headline text-base font-semibold text-foreground leading-tight">
                      {reward.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {reward.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-stat text-xl font-bold text-primary tabular-nums leading-none">
                      {reward.costPoints}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                      {affordable ? "pts" : `–${missing}`}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground text-center pt-2">
        {items.length} recompensas disponíveis
      </p>
    </div>
  );
}
