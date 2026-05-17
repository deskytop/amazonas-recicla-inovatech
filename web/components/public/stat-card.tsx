export interface StatCardProps {
  value: string;
  label: string;
  source?: string;
  highlight?: boolean;
}

export function StatCard({ value, label, source, highlight }: StatCardProps) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl bg-primary text-primary-foreground p-6 space-y-2"
          : "rounded-2xl border border-border bg-card p-6 space-y-2"
      }
    >
      <p className={`font-display text-3xl md:text-4xl font-bold leading-none ${highlight ? "" : "text-primary"}`}>
        {value}
      </p>
      <p className="text-sm leading-tight">{label}</p>
      {source && (
        <p className={`font-mono text-[9px] uppercase tracking-widest ${highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          Fonte: {source}
        </p>
      )}
    </div>
  );
}
