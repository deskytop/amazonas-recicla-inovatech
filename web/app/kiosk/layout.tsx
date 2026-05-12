import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Amazonas Recicla — Lixeira",
  description: "Display interativo da lixeira inteligente Amazonas Recicla.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00450d",
};

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {children}
    </div>
  );
}
