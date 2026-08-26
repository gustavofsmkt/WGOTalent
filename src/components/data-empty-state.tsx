import * as React from "react";
import { type LucideIcon, Inbox } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "~/components/ui/empty";
import { cn } from "~/lib/utils";

export interface DataEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function DataEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  ...props
}: DataEmptyStateProps) {
  return (
    <Empty
      className={cn(
        "border border-dashed border-border/60 bg-muted/20 py-12 px-6 rounded-xl",
        className,
      )}
      {...props}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
