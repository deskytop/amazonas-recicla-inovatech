import { Card } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function OnboardingBanner() {
  return (
    <Card className="p-5 bg-gradient-to-br from-accent/15 to-primary/10 border-accent/40 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <p className="font-display font-bold text-primary">Bem-vindo!</p>
      </div>
      <p className="text-sm text-foreground">
        Você ainda não fez nenhum descarte. Encontre uma lixeira do{" "}
        <strong>Amazonas Recicla</strong>, escaneie o QR Code e ganhe seus primeiros pontos.
      </p>
      <Link
        href="/app/escanear"
        className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-primary font-semibold hover:underline"
      >
        Como funciona <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}
