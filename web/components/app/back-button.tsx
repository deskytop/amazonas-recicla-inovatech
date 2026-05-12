import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackButton({ href, label = "Voltar", className }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
      {label}
    </Link>
  );
}
