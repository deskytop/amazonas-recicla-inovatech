import { ScanLine, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { QrScanner } from "@/components/app/qr-scanner";

export const dynamic = "force-dynamic";

export default function EscanearPage() {
  return (
    <div className="p-6 space-y-6">
      <header className="space-y-2 text-center">
        <ScanLine className="h-12 w-12 mx-auto text-primary" />
        <h1 className="font-display text-3xl font-bold text-primary">
          Escanear lixeira
        </h1>
        <p className="text-sm text-muted-foreground">
          Aponte a câmera pro QR Code do tablet — sem sair do app.
        </p>
      </header>

      <Card className="p-5">
        <QrScanner />
      </Card>

      <details className="text-sm">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Como funciona
        </summary>
        <ol className="mt-3 space-y-3">
          <li className="flex gap-3">
            <span className="rounded-full bg-primary text-primary-foreground h-6 w-6 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
              1
            </span>
            <p>Toque em <strong>Abrir câmera</strong> e permita o acesso quando o navegador pedir.</p>
          </li>
          <li className="flex gap-3">
            <span className="rounded-full bg-primary text-primary-foreground h-6 w-6 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
              2
            </span>
            <p>Aponte pro QR Code exibido no tablet acoplado à lixeira.</p>
          </li>
          <li className="flex gap-3">
            <span className="rounded-full bg-primary text-primary-foreground h-6 w-6 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
              3
            </span>
            <p>O app abre a sessão automaticamente. Deposite o material.</p>
          </li>
        </ol>
      </details>

      <Link href="/app/mapa">
        <Card className="p-4 flex items-center gap-3 bg-accent/15 border-accent hover:bg-accent/25 transition-colors">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm flex-1">
            Procurando uma lixeira? Veja o <strong>Mapa</strong>.
          </p>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Card>
      </Link>
    </div>
  );
}
