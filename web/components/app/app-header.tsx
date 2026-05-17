import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Sprout } from "lucide-react";
import Link from "next/link";

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
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-2">
          <div className="rounded-full bg-primary text-primary-foreground h-7 w-7 flex items-center justify-center">
            <Sprout className="h-4 w-4" />
          </div>
          <span className="font-display font-bold text-primary text-sm">
            Amazonas Recicla
          </span>
        </Link>
        {profile && (
          <Link
            href="/app/perfil"
            className="rounded-full bg-primary/10 text-primary px-3 py-1 font-mono text-xs font-bold tabular-nums hover:bg-primary/20 transition-colors"
          >
            {profile.totalPoints} pts
          </Link>
        )}
      </div>
    </header>
  );
}
