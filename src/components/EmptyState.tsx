import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="rounded-2xl bg-primary/10 p-5 mb-5">
        <Icon className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="btn-primary-glow text-primary-foreground rounded-xl">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
