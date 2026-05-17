import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { profiles, redemptions, rewards, sessions } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { levelForLifetimePoints, progressToNextLevel } from "@/lib/domain/levels";
import { signOutAction } from "@/lib/actions/sign-out";

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

  const [discardStats] = await db
    .select({ total: count() })
    .from(sessions)
    .where(
      and(eq(sessions.userId, user.id), eq(sessions.status, "completed")),
    );

  const initials = profile.displayName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const level = levelForLifetimePoints(profile.lifetimePointsEarned);
  const progress = progressToNextLevel(profile.lifetimePointsEarned);
  const discardCount = discardStats?.total ?? 0;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Identidade — avatar centralizado, respirável */}
      <header className="flex flex-col items-center text-center space-y-3 pt-2">
        <Avatar className="h-20 w-20 border-2 border-primary shadow-editorial">
          {profile.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground font-headline text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1 max-w-full">
          <h1 className="font-headline text-2xl font-bold leading-tight">
            {profile.displayName}
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground break-all">
            {user.email}
          </p>
        </div>

        {/* Level badge editorial */}
        <div className="inline-flex items-baseline gap-2 bg-primary text-primary-foreground px-4 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] opacity-80">
            Nível {level.id}
          </span>
          <span className="font-headline text-base font-bold leading-none">
            {level.name}
          </span>
        </div>

        {/* Progressão pro próximo nível */}
        {progress.next && (
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Faltam{" "}
            <span className="font-stat text-foreground tabular-nums">
              {progress.pointsToNext}
            </span>{" "}
            pts para {progress.next.name}
          </p>
        )}
      </header>

      {/* Stats editoriais */}
      <dl className="divide-y divide-border border-y border-border">
        <Row label="Saldo atual" value={profile.totalPoints.toString()} unit="pts" emphasis />
        <Row label="Total acumulado" value={profile.lifetimePointsEarned.toString()} unit="pts" />
        <Row label="Conta criada em" value={DATE_FORMAT.format(profile.createdAt)} />
      </dl>

      {/* Atividade — caminho pra histórico e missões */}
      <section className="space-y-2">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-accent">
          Sua atividade
        </h2>
        <ul className="divide-y divide-border border-y border-border">
          <ActivityLink
            href="/app/historico"
            title="Histórico"
            hint={
              discardCount > 0
                ? `${discardCount} descarte${discardCount === 1 ? "" : "s"} registrado${discardCount === 1 ? "" : "s"}`
                : "Nenhum descarte ainda"
            }
            count={discardCount}
          />
          <ActivityLink
            href="/app/missoes"
            title="Missões"
            hint="Ganhe pontos extras"
          />
          <ActivityLink
            href="/app/recompensas"
            title="Recompensas"
            hint="Troque pontos por prêmios"
          />
        </ul>
      </section>

      {/* Conquistas (digital badges) */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-accent">
            Conquistas
          </h2>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {badges.length.toString().padStart(2, "0")}
          </span>
        </div>

        {badges.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            Resgate badges na aba Prêmios para que apareçam aqui.
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

      {/* Sobre o projeto — públicas */}
      <section className="space-y-2">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-accent">
          Sobre o projeto
        </h2>
        <ul className="divide-y divide-border border-y border-border">
          <ActivityLink href="/sobre" title="Sobre" hint="Manifesto e solução" external />
          <ActivityLink href="/dados" title="Dados de impacto" hint="Métricas em tempo real" external />
          <ActivityLink href="/equipe" title="Equipe" hint="16 autores + orientador" external />
        </ul>
      </section>

      {/* Sair */}
      <form action={signOutAction} className="pt-2">
        <Button
          type="submit"
          variant="outline"
          className="w-full font-mono text-[11px] uppercase tracking-[0.2em] border-foreground/30 hover:border-foreground"
        >
          Sair da conta
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

function ActivityLink({
  href,
  title,
  hint,
  count,
  external,
}: {
  href: string;
  title: string;
  hint: string;
  count?: number;
  external?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between py-3 hover:bg-muted/40 transition-colors group -mx-4 px-4"
      >
        <span className="flex-1 min-w-0">
          <p className="font-headline text-sm font-semibold text-foreground leading-tight">
            {title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        </span>
        <span className="flex items-baseline gap-2 flex-shrink-0">
          {count !== undefined && count > 0 && (
            <span className="font-stat text-base text-primary font-bold tabular-nums leading-none">
              {count}
            </span>
          )}
          <span className="font-mono text-xs text-muted-foreground group-hover:text-primary transition-colors">
            {external ? "↗" : "→"}
          </span>
        </span>
      </Link>
    </li>
  );
}
