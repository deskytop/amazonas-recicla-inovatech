import { ScanLine, MapPin, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function EscanearPage() {
  return (
    <div className="p-6 space-y-6">
      <header className="space-y-2 text-center">
        <ScanLine className="h-12 w-12 mx-auto text-primary" />
        <h1 className="font-display text-3xl font-bold text-primary">
          Como escanear
        </h1>
      </header>

      <Card className="p-5 space-y-4">
        <div className="flex gap-3">
          <div className="rounded-full bg-primary text-primary-foreground h-7 w-7 flex items-center justify-center font-mono text-sm font-bold flex-shrink-0">
            1
          </div>
          <p className="text-sm text-foreground">
            Aproxime-se de uma <strong>lixeira Amazonas Recicla</strong>.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-full bg-primary text-primary-foreground h-7 w-7 flex items-center justify-center font-mono text-sm font-bold flex-shrink-0">
            2
          </div>
          <p className="text-sm text-foreground">
            Use a <strong>câmera nativa do seu celular</strong> e aponte para o QR Code exibido no tablet da lixeira.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-full bg-primary text-primary-foreground h-7 w-7 flex items-center justify-center font-mono text-sm font-bold flex-shrink-0">
            3
          </div>
          <p className="text-sm text-foreground">
            Toque na notificação para abrir e confirme o início da sessão.
          </p>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-3 bg-accent/15 border-accent">
        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
        <p className="text-sm flex-1">
          Procurando uma lixeira? Veja o <strong>Mapa</strong> no menu.
        </p>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Card>
    </div>
  );
}
