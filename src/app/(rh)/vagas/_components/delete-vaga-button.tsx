"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "~/components/ui/toast";
import { Button } from "~/components/ui/button";
import { deleteVaga } from "~/actions/vagas";
import { cn } from "~/lib/utils";

interface DeleteVagaButtonProps {
  vagaId: string;
  vagaTitulo?: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function DeleteVagaButton({
  vagaId,
  vagaTitulo = "esta vaga",
  redirectTo,
  variant = "icon",
  className,
}: DeleteVagaButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteVaga(vagaId);

      if (result.success) {
        toast.add({
          type: "success",
          description: result.message ?? "Vaga excluída com sucesso.",
        });
        setIsConfirming(false);
        if (redirectTo) {
          router.push(redirectTo);
        }
      } else {
        toast.add({
          type: "error",
          description: result.message ?? "Erro ao excluir vaga.",
        });
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
        title={`Excluir ${vagaTitulo}`}
        aria-label={`Excluir ${vagaTitulo}`}
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
      title={`Excluir ${vagaTitulo}`}
      aria-label={`Excluir ${vagaTitulo}`}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
