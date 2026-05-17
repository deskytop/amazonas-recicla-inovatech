"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/dados", label: "Dados" },
  { href: "/equipe", label: "Equipe" },
] as const;

export interface PublicHeaderNavProps {
  isAuthenticated: boolean;
}

export function PublicHeaderNav({ isAuthenticated }: PublicHeaderNavProps) {
  const pathname = usePathname();
  const ctaHref = isAuthenticated ? "/app" : "/login";
  const ctaLabel = isAuthenticated ? "Meu app" : "Entrar";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex h-20 items-center justify-between px-6">
        <Link href="/" className="flex items-baseline gap-2.5 group">
          <span className="font-headline text-2xl font-bold text-primary group-hover:text-secondary transition-colors">
            Amazonas
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-accent">
            ↻ recicla
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors relative",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-amber-accent" />
                )}
              </Link>
            );
          })}
          <Link
            href={ctaHref}
            className="ml-4 inline-flex items-center gap-2 rounded-none border border-primary bg-primary text-primary-foreground px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-background hover:text-primary transition-colors group"
          >
            {ctaLabel}
            <span className="inline-block transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </nav>

        <Link
          href={ctaHref}
          className="md:hidden inline-flex items-center gap-2 border border-primary bg-primary text-primary-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em]"
        >
          {ctaLabel} →
        </Link>
      </div>
    </header>
  );
}
