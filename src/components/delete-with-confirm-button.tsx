"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { toastActionPromise } from "~/lib/toast-promise";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface DeleteWithConfirmButtonProps {
  onDelete: () => Promise<{ success: boolean; message?: string | null }>;
  label?: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  buttonLabel?: string;
  buttonVariant?: "outline" | "destructive";
  className?: string;
}

export function DeleteWithConfirmButton({
  onDelete,
  label = "este item",
  redirectTo,
  variant = "icon",
  buttonLabel = "Excluir",
  buttonVariant = "outline",
  className,
}: DeleteWithConfirmButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = React.useState(false);

  const handleDelete = () => {
    setIsConfirming(false);
    toastActionPromise(onDelete(), {
      loading: "Excluindo...",
      success: ({ message }) => message ?? "Excluído com sucesso.",
      onSuccess: () => {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      },
    });
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in duration-200">
        <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:inline-flex">
          <AlertTriangle className="size-3 text-destructive" />
          Confirmar?
        </span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="h-8 px-2 text-xs"
        >
          Sim, excluir
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsConfirming(false)}
          className="h-8 px-2 text-xs"
        >
          Cancelar
        </Button>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant={buttonVariant}
        size="sm"
        className={cn(
          buttonVariant === "outline" &&
            "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive",
          className,
        )}
        onClick={() => setIsConfirming(true)}
        title={`Excluir ${label}`}
        aria-label={`Excluir ${label}`}
      >
        <Trash2 className="mr-2 size-4" />
        {buttonLabel}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
        className,
      )}
      onClick={() => setIsConfirming(true)}
      title={`Excluir ${label}`}
      aria-label={`Excluir ${label}`}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
