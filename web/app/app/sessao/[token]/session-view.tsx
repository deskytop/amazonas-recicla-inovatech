"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SessionCountdown } from "@/components/app/session-countdown";
import { MaterialIcon } from "@/components/app/material-icon";
import { BackButton } from "@/components/app/back-button";
import type { Material } from "@/lib/domain/materials";
import type { SessionStatus } from "@/lib/domain/session-lifecycle";
import { Sparkles, AlertCircle, CheckCircle2, PackageOpen } from "lucide-react";

interface SessionState {
  token: string;
  status: SessionStatus;
  material: Material | null;
  pointsValue: number | null;
  expiresAt: string;
  imageUrl: string | null;
}

export function SessionView({ initialSession }: { initialSession: SessionState }) {
  const [session, setSession] = useState<SessionState>(initialSession);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      if (cancelled || !authSession) return;

      // Auth explicito antes do subscribe: garante que o JWT chegue na join
      // do canal pra RLS aprovar a leitura da row.
      await supabase.realtime.setAuth(authSession.access_token);
      if (cancelled) return;

      channel = supabase
        .channel(`session:${session.token}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sessions",
            filter: `token=eq.${session.token}`,
          },
          (payload) => {
            const row = payload.new as {
              status: SessionStatus;
              material: Material | null;
              points_value: number | null;
              expires_at: string;
              image_url: string | null;
            };
            setSession((prev) => ({
              ...prev,
              status: row.status,
              material: row.material,
              pointsValue: row.points_value,
              expiresAt: row.expires_at,
              imageUrl: row.image_url ?? prev.imageUrl,
            }));
          },
        )
        .subscribe((status, err) => {
          // eslint-disable-next-line no-console
          console.log(
            `[realtime] session:${session.token} status=${status}`,
            err ?? "",
          );
        });
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [session.token]);

  if (session.status === "completed") {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] space-y-4 text-center">
        <div className="rounded-full bg-accent p-6">
          <CheckCircle2 className="h-12 w-12 text-accent-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold text-primary">
          Obrigado por reciclar!
        </h1>
        {session.material && (
          <div className="flex items-center gap-2">
            <MaterialIcon material={session.material} size={32} label />
          </div>
        )}
        <p className="font-display text-5xl font-bold text-accent-foreground">
          +{session.pointsValue} pts
        </p>
        <p className="text-muted-foreground">Pontos creditados ao seu saldo.</p>
        {session.imageUrl && (
          <figure className="mt-4 max-w-xs">
            <img
              src={session.imageUrl}
              alt="Material capturado pela câmera"
              className="rounded-md border border-border w-full"
            />
            <figcaption className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
              Captura analisada pela IA
            </figcaption>
          </figure>
        )}
        <BackButton href="/app" label="Voltar para o início" className="mt-4" />
      </div>
    );
  }

  if (session.status === "expired") {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Sessão expirada</h1>
        <p className="text-muted-foreground">
          Volte à lixeira e escaneie o QR Code para tentar novamente.
        </p>
        <BackButton href="/app" label="Voltar para o início" className="mt-4" />
      </div>
    );
  }

  if (session.status === "failed") {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="font-display text-2xl font-bold">Algo deu errado</h1>
        <p className="text-muted-foreground">
          A lixeira não conseguiu processar este descarte. Tente novamente.
        </p>
        <BackButton href="/app" label="Voltar para o início" className="mt-4" />
      </div>
    );
  }

  if (session.status === "material_detected" && session.material) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] space-y-4 text-center">
        <Sparkles className="h-12 w-12 text-accent-foreground animate-pulse" />
        <h1 className="font-display text-2xl font-bold">Material identificado!</h1>
        <MaterialIcon material={session.material} size={48} label />
        <p className="font-display text-4xl font-bold text-primary">
          +{session.pointsValue} pts
        </p>
        {session.imageUrl && (
          <img
            src={session.imageUrl}
            alt="Material capturado pela câmera"
            className="rounded-md border border-border max-w-xs w-full"
          />
        )}
        <p className="text-muted-foreground">Aguardando a lixeira finalizar...</p>
      </div>
    );
  }

  // awaiting_material
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] space-y-6 text-center">
      <PackageOpen className="h-16 w-16 text-primary animate-bounce" />
      <h1 className="font-display text-3xl font-bold text-primary">
        Deposite o resíduo
      </h1>
      <p className="text-muted-foreground max-w-xs">
        A gaveta da lixeira está aberta. Coloque o material e aguarde a identificação.
      </p>
      <div className="rounded-full bg-card border border-border px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          Tempo restante
        </p>
        <SessionCountdown
          expiresAt={session.expiresAt}
          onExpire={() => setSession((s) => ({ ...s, status: "expired" }))}
        />
      </div>
    </div>
  );
}
