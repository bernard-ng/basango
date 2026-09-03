import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@basango/ui/components/empty";
import { cn } from "@basango/ui/lib/utils";
import type { LucideIcon } from "lucide-react";

type IngestionEmptyStateProps = {
  className?: string;
  description: string;
  icon: LucideIcon;
  title: string;
};

export function IngestionEmptyState({
  className,
  description,
  icon: Icon,
  title,
}: IngestionEmptyStateProps) {
  return (
    <Empty className={cn("min-h-32", className)}>
      <EmptyHeader>
        <EmptyMedia className="text-muted-foreground/60 [&_svg]:size-8">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
