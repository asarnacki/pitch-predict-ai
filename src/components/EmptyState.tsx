import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
      <div className="max-w-md text-center space-y-4">
        <h3 className="text-xl sm:text-2xl font-semibold">{title}</h3>
        <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="default" className="mt-2">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
