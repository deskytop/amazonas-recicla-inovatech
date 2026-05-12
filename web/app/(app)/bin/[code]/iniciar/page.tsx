import { db } from "@/lib/db/client";
import { bins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createSessionAction } from "@/lib/actions/create-session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export default async function IniciarSessaoPage({ params }: Params) {
  const { code } = await params;

  const [bin] = await db.select().from(bins).where(eq(bins.code, code)).limit(1);

  if (!bin) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="font-display text-2xl font-bold">Lixeira não encontrada</h1>
        <p className="text-muted-foreground">
          O código <span className="font-mono">{code}</span> não está cadastrado.
        </p>
      </div>
    );
  }

  if (bin.status !== "active") {
    return (
      <div className="p-6 space-y-3">
        <h1 className="font-display text-2xl font-bold">Lixeira indisponível</h1>
        <p className="text-muted-foreground">
          Esta lixeira está em <strong>{bin.status}</strong>. Tente outra próxima.
        </p>
      </div>
    );
  }

  async function handleStart() {
    "use server";
    const result = await createSessionAction(code);
    if (!result.ok) {
      throw new Error(result.error);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-2 text-center">
        <Sparkles className="h-12 w-12 mx-auto text-primary" />
        <h1 className="font-display text-3xl font-bold text-primary">
          Iniciar descarte
        </h1>
        <p className="text-muted-foreground">
          Confirme abaixo e a lixeira vai liberar a gaveta pra você depositar o resíduo.
        </p>
      </header>

      <Card className="p-5 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <MapPin className="h-4 w-4" />
          <span>{bin.locationName}</span>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {bin.code}
        </p>
      </Card>

      <form action={handleStart}>
        <Button
          type="submit"
          size="lg"
          className="w-full font-mono uppercase tracking-wider"
        >
          Iniciar sessão
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        A sessão tem 60 segundos para você depositar o material após iniciar.
      </p>
    </div>
  );
}
