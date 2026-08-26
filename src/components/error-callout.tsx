import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { cn } from "~/lib/utils";

export interface ErrorCalloutProps extends React.ComponentProps<typeof Alert> {
  title?: string;
  message?: React.ReactNode;
  errors?: string[];
}

export function ErrorCallout({
  title = "Erro",
  message,
  errors,
  children,
  className,
  ...props
}: ErrorCalloutProps) {
  if (!message && !children && (!errors || errors.length === 0)) {
    return null;
  }

  return (
    <Alert
      variant="destructive"
      className={cn("text-left", className)}
      {...props}
    >
      <AlertCircle className="size-4" aria-hidden="true" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>
        {message}
        {children}
        {errors && errors.length > 0 && (
          <ul className="mt-2.5 list-disc list-inside space-y-1">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
