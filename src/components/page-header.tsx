import * as React from "react";
import { cn } from "~/lib/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/60 mb-6",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
