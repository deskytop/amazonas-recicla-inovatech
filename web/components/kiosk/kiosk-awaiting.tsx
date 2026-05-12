"use client";

import { useEffect, useState } from "react";
import { PackageOpen } from "lucide-react";

export interface KioskAwaitingProps {
  userDisplayName: string;
  expiresAt: string;
}

export function KioskAwaiting({ userDisplayName, expiresAt }: KioskAwaitingProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(
        Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
      );
    }, 250);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-12">
      <div className="rounded-full bg-accent p-12">
        <PackageOpen className="h-32 w-32 text-accent-foreground animate-bounce" />
      </div>

      <div className="text-center space-y-3">
        <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Sessão iniciada por
        </p>
        <h1 className="font-display text-6xl font-bold text-primary">
          {userDisplayName}
        </h1>
      </div>

      <p className="font-display text-3xl text-foreground">
        Deposite o resíduo agora
      </p>

      <div className="rounded-full bg-card border-2 border-border px-8 py-4">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Tempo restante
        </p>
        <p
          className={`font-mono text-4xl font-bold tabular-nums ${remaining <= 10 ? "text-destructive" : "text-foreground"}`}
        >
          0:{remaining.toString().padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
