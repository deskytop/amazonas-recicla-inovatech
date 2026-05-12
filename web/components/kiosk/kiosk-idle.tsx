import { QRDisplay } from "./qr-display";
import { ShowcaseCarousel } from "./showcase-carousel";
import { MapPin } from "lucide-react";

export interface KioskIdleProps {
  claimUrl: string;
  binCode: string;
  locationName: string;
}

export function KioskIdle({ claimUrl, binCode, locationName }: KioskIdleProps) {
  return (
    <div className="min-h-screen flex flex-col p-12">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Amazonas Recicla
          </p>
          <h1 className="font-display text-2xl font-bold text-primary">
            Resíduo hoje, recurso amanhã
          </h1>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{locationName}</span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {binCode}
          </p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center gap-16 py-8">
        <div className="flex flex-col items-center gap-4">
          <QRDisplay value={claimUrl} size={420} />
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-primary">
              Escaneie para descartar
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Aponte a câmera do celular para o QR Code
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-2xl">
          <ShowcaseCarousel />
        </div>
      </main>

      <footer className="flex justify-between items-center text-xs text-muted-foreground">
        <span className="font-mono uppercase tracking-widest">
          Comprovantes auditáveis via PL 128/2025
        </span>
        <span className="font-mono uppercase tracking-widest opacity-60">
          Inov@tech FAMETRO 2026
        </span>
      </footer>
    </div>
  );
}
