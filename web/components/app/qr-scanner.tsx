"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, X, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const READER_ID = "qr-reader";

// Aceita URLs do tipo /app/bin/{code}/iniciar (relativas ou absolutas).
const BIN_CODE_REGEX = /\/app\/bin\/([A-Z0-9_-]+)\/iniciar/i;

export function QrScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      const s = scannerRef.current;
      if (s && s.isScanning) {
        s.stop().catch(() => {});
      }
    };
  }, []);

  async function start() {
    setError(null);
    setScanning(true);

    // Espera o div #qr-reader montar.
    await new Promise((r) => setTimeout(r, 80));

    const html5QrCode = new Html5Qrcode(READER_ID);
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => onDecoded(decodedText, html5QrCode),
        () => {
          /* ignora erros de leitura frequentes */
        },
      );
    } catch (err) {
      console.warn("[qr] camera start failed:", err);
      setError(
        "Não foi possível acessar a câmera. Verifique a permissão do navegador.",
      );
      setScanning(false);
    }
  }

  async function onDecoded(text: string, scanner: Html5Qrcode) {
    const match = text.match(BIN_CODE_REGEX);
    if (!match) {
      setError("QR Code inválido. Procure um QR de uma lixeira Amazonas Recicla.");
      return;
    }
    const binCode = match[1]!.toUpperCase();
    try {
      await scanner.stop();
    } catch {
      /* noop */
    }
    router.push(`/app/bin/${binCode}/iniciar`);
  }

  async function stop() {
    const s = scannerRef.current;
    if (s && s.isScanning) {
      try {
        await s.stop();
      } catch {
        /* noop */
      }
    }
    setScanning(false);
  }

  if (!scanning) {
    return (
      <div className="space-y-3">
        <Button
          onClick={start}
          size="lg"
          className="w-full text-base font-semibold gap-2"
        >
          <ScanLine className="h-5 w-5" />
          Abrir câmera e escanear
        </Button>
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <CameraOff className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-md overflow-hidden border border-border bg-black">
        <div id={READER_ID} className="w-full aspect-square" />
      </div>
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <CameraOff className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      <Button onClick={stop} variant="outline" className="w-full gap-2">
        <X className="h-4 w-4" />
        Cancelar
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Aponte a câmera pro QR Code do tablet da lixeira.
      </p>
    </div>
  );
}
