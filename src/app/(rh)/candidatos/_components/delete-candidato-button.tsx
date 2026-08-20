"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { deleteCandidato } from "~/actions/candidatos";
import { cn } from "~/lib/utils";

interface DeleteCandidatoButtonProps {
  candidatoId: string;
  candidatoNome?: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function DeleteCandidatoButton({
  candidatoId,
  candidatoNome = "este candidato",
  redirectTo,
  variant = "icon",
  className,
}: DeleteCandidatoButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCandidato(candidatoId);

      if (result.success) {
        toast.success(result.message ?? "Candidato excluído com sucesso.");
        setIsConfirming(false);
        if (redirectTo) {
          router.push(redirectTo);
        }
      } else {
        toast.error(result.message ?? "Erro ao excluir candidato.");
        setIsConfirming(false);
      }
    });
  };

  if (isConfirming) {
    return (
      <div className="relative inline-flex">
        <Button
          type="button"
          variant={variant === "button" ? "outline" : "ghost"}
          size={variant === "button" ? "sm" : "icon-xs"}
          className="invisible"
          tabIndex={-1}
          aria-hidden="true"
        >
          <Trash2 className={variant === "button" ? "size-4" : "size-3.5"} />
        </Button>
        <div className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
          <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
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
      </div>
    );
  }

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setIsConfirming(true)}
        className={cn("gap-1.5", className)}
      >
        <Trash2 className="size-3.5" />
        Excluir Candidato
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={() => setIsConfirming(true)}
      className={cn(
        "text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
        className,
      )}
      title={`Excluir ${candidatoNome}`}
      aria-label={`Excluir candidato ${candidatoNome}`}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
