import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { HeaderPointsBadge } from "./header-points-badge";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile] = await db
    .select({
      displayName: profiles.displayName,
      totalPoints: profiles.totalPoints,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/app" className="flex items-baseline gap-1 group">
          <span className="font-headline text-base font-bold text-primary leading-none">
            Amazonas
          </span>
          <span className="text-amber-accent text-base leading-none">.</span>
        </Link>
        {profile && (
          <HeaderPointsBadge
            userId={user.id}
            initialTotalPoints={profile.totalPoints}
          />
        )}
      </div>
    </header>
  );
}
