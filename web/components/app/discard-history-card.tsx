import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MaterialIcon } from "./material-icon";
import { MATERIAL_LABELS, type Material } from "@/lib/domain/materials";
import { ChevronRight } from "lucide-react";

export interface DiscardHistoryCardProps {
  sessionId: string;
  material: Material;
  pointsValue: number;
  completedAt: Date;
  binLocationName: string;
}

const TIME_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function DiscardHistoryCard({
  sessionId,
  material,
  pointsValue,
  completedAt,
  binLocationName,
}: DiscardHistoryCardProps) {
  return (
    <Link
      href={`/app/historico/${sessionId}`}
      className="block transition-colors hover:bg-muted/40 rounded-md"
    >
      <Card className="p-4 flex items-center gap-3">
        <MaterialIcon material={material} size={36} />
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold">
            {MATERIAL_LABELS[material]}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {binLocationName}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-primary tabular-nums">
            +{pointsValue}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {TIME_FORMAT.format(completedAt)}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </Card>
    </Link>
  );
}
