"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, ScanLine, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/mapa", label: "Mapa", icon: Map },
  { href: "/app/escanear", label: "Escanear", icon: ScanLine },
  { href: "/app/recompensas", label: "Prêmios", icon: Gift },
  { href: "/app/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="grid grid-cols-5 max-w-md mx-auto">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
