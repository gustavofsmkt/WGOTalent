import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export interface FormSubmitButtonProps extends React.ComponentProps<
  typeof Button
> {
  pending?: boolean;
  loadingText?: React.ReactNode;
}

export function FormSubmitButton({
  children = "Salvar",
  pending = false,
  loadingText = "Salvando...",
  disabled,
  className,
  type = "submit",
  ...props
}: FormSubmitButtonProps) {
  return (
    <Button
      type={type}
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={cn("min-w-[100px]", className)}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
