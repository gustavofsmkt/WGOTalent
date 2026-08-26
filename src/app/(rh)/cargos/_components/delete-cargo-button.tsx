"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { deleteCargo } from "~/actions/cargos";
import { cn } from "~/lib/utils";

interface DeleteCargoButtonProps {
  cargoId: string;
  cargoTitulo: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function DeleteCargoButton({
  cargoId,
  cargoTitulo,
  redirectTo,
  variant = "icon",
  className,
}: DeleteCargoButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCargo(cargoId);

      if (result.success) {
        toast.success(result.message ?? "Cargo excluído com sucesso.");
        setIsConfirming(false);
        if (redirectTo) {
          router.push(redirectTo);
        }
      } else {
        toast.error(result.message ?? "Erro ao excluir cargo.");
        setIsConfirming(false);
      }
    });
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in duration-200">
        <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-2">
          <AlertTriangle className="size-3 text-destructive" />
          Confirmar?
        </span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={handleDelete}
          className="h-8 px-2 text-xs"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            "Sim, excluir"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
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
        variant="outline"
        size="sm"
        className={cn(
          "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30",
          className,
        )}
        onClick={() => setIsConfirming(true)}
        title={`Excluir cargo ${cargoTitulo}`}
        aria-label={`Excluir cargo ${cargoTitulo}`}
      >
        <Trash2 className="size-4 mr-2" />
        Excluir
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
        className,
      )}
      onClick={() => setIsConfirming(true)}
      title={`Excluir cargo ${cargoTitulo}`}
      aria-label={`Excluir cargo ${cargoTitulo}`}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
