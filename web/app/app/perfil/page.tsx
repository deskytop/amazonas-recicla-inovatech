import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles, redemptions, rewards } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { levelForLifetimePoints } from "@/lib/domain/levels";
import { signOutAction } from "@/lib/actions/sign-out";
import { Award } from "lucide-react";

export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

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

  const level = levelForLifetimePoints(profile.lifetimePointsEarned);

  return (
    <div className="px-4 py-5 space-y-6">
      <header className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 border-2 border-primary">
            {profile.avatarUrl && (
              <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground font-headline text-base font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="font-headline text-xl font-bold leading-tight truncate">
              {profile.displayName}
            </h1>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex items-baseline gap-2 border-l-2 border-amber-accent pl-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-accent">
            Nível {level.id}
          </span>
          <span className="font-headline text-lg font-bold text-primary leading-none">
            {level.name}
          </span>
        </div>
      </header>

      <dl className="divide-y divide-border border-y border-border">
        <Row label="Saldo atual" value={profile.totalPoints.toString()} unit="pts" emphasis />
        <Row label="Total acumulado" value={profile.lifetimePointsEarned.toString()} unit="pts" />
        <Row label="Conta criada em" value={DATE_FORMAT.format(profile.createdAt)} />
      </dl>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-3.5 w-3.5 text-amber-accent" />
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-accent">
              Conquistas
            </h2>
          </div>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {badges.length.toString().padStart(2, "0")}
          </span>
        </div>

        {badges.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Nenhuma conquista ainda. Resgate badges na aba Prêmios.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {badges.map((badge) => (
              <li key={badge.redemptionId}>
                <article className="p-3 border-l-2 border-amber-accent bg-amber-accent/5 space-y-1">
                  <p className="font-headline text-sm font-semibold leading-tight">
                    {badge.title}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    {DATE_FORMAT.format(badge.redeemedAt)}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-accent">
          Sobre o projeto
        </h2>
        <ul className="divide-y divide-border border-y border-border">
          <ProjectLink href="/sobre" title="Sobre" hint="Manifesto e solução" />
          <ProjectLink href="/dados" title="Dados de impacto" hint="Métricas em tempo real" />
          <ProjectLink href="/equipe" title="Equipe" hint="16 autores + orientador" />
        </ul>
      </section>

      <form action={signOutAction} className="pt-2">
        <Button
          type="submit"
          variant="outline"
          className="w-full font-mono text-[11px] uppercase tracking-[0.2em] border-foreground/30 hover:border-foreground"
        >
          Sair
        </Button>
      </form>
    </div>
  );
}

function Row({
  label,
  value,
  unit,
  emphasis,
}: {
  label: string;
  value: string;
  unit?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <span
          className={`font-stat tabular-nums leading-none ${
            emphasis ? "text-2xl text-primary font-bold" : "text-lg text-foreground"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

function ProjectLink({
  href,
  title,
  hint,
}: {
  href: string;
  title: string;
  hint: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-baseline justify-between py-3 hover:bg-muted/40 transition-colors -mx-4 px-4 group"
      >
        <span>
          <p className="font-headline text-sm font-semibold text-foreground leading-none">
            {title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        </span>
        <span className="font-mono text-xs text-muted-foreground group-hover:text-primary transition-colors">
          →
        </span>
      </Link>
    </li>
  );
}
