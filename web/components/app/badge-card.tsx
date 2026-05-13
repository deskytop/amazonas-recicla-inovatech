import { Award } from "lucide-react";

export interface BadgeCardProps {
  title: string;
  redeemedAt: Date;
}

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function BadgeCard({ title, redeemedAt }: BadgeCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-3 rounded-xl bg-accent/10 border border-accent/30">
      <div className="rounded-full bg-accent text-accent-foreground h-12 w-12 flex items-center justify-center mb-2">
        <Award className="h-6 w-6" />
      </div>
      <p className="font-display text-xs font-semibold leading-tight">{title}</p>
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
        {DATE_FORMAT.format(redeemedAt)}
      </p>
    </div>
  );
}
