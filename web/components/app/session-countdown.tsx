"use client";

import { useEffect, useState } from "react";

export interface SessionCountdownProps {
  expiresAt: string | Date;
  onExpire?: () => void;
}

export function SessionCountdown({ expiresAt, onExpire }: SessionCountdownProps) {
  const expiresMs =
    typeof expiresAt === "string" ? new Date(expiresAt).getTime() : expiresAt.getTime();

  const compute = () => Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));

  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    const id = setInterval(() => {
      const next = compute();
      setRemaining(next);
      if (next === 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresMs]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= 10;

  return (
    <span
      className={`font-mono tabular-nums ${urgent ? "text-destructive" : "text-muted-foreground"}`}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
