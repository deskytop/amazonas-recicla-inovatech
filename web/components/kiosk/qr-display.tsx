"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export interface QRDisplayProps {
  value: string;
  size?: number;
}

export function QRDisplay({ value, size = 400 }: QRDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#00450d", light: "#FFFFFF" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className="bg-card rounded-3xl animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={dataUrl}
      alt="QR Code para iniciar sessão de descarte"
      width={size}
      height={size}
      className="rounded-3xl shadow-xl"
    />
  );
}
