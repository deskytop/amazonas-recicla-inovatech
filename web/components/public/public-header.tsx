"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/dados", label: "Dados" },
  { href: "/equipe", label: "Equipe" },
] as const;

export function PublicHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="rounded-full bg-primary text-primary-foreground h-9 w-9 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display font-bold text-primary leading-none">
              Amazonas Recicla
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground leading-none mt-1">
              Resíduo hoje, recurso amanhã
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "font-mono text-xs uppercase tracking-wider transition-colors",
                pathname === item.href
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors"
          >
            Entrar
          </Link>
        </nav>

        <Link
          href="/login"
          className="md:hidden rounded-full bg-primary text-primary-foreground px-4 py-1.5 font-mono text-xs uppercase tracking-wider"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}
