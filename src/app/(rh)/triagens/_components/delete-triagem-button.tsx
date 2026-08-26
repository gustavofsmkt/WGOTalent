"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { deleteTriagem } from "~/actions/triagens";

interface DeleteTriagemButtonProps {
  triagemId: string;
  candidatoNome?: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function DeleteTriagemButton({
  triagemId,
  candidatoNome = "esta triagem",
  redirectTo,
  variant = "icon",
  className,
}: DeleteTriagemButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTriagem(triagemId);

      if (result.success) {
        toast.success(result.message ?? "Triagem excluída com sucesso.");
        setIsConfirming(false);
        if (redirectTo) {
          router.push(redirectTo);
        }
      } else {
        toast.error(result.message ?? "Erro ao excluir triagem.");
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
        variant="destructive"
        size="sm"
        onClick={() => setIsConfirming(true)}
        className={className}
      >
        <Trash2 className="size-4 mr-2" />
        Excluir Triagem
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={() => setIsConfirming(true)}
      title={`Excluir triagem de ${candidatoNome}`}
      className={className ?? "text-muted-foreground hover:text-destructive"}
    >
      <Trash2 className="size-4" />
      <span className="sr-only">Excluir triagem de {candidatoNome}</span>
    </Button>
  );
}
