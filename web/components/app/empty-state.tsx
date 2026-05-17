import { Card } from "@/components/ui/card";

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-10 text-center space-y-3 bg-muted/30 border-dashed">
      <div className="rounded-full bg-primary/10 h-14 w-14 mx-auto flex items-center justify-center">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <p className="font-display font-semibold">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </Card>
  );
}
