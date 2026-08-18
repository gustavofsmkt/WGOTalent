"use client";

import * as React from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { deleteDepartamento } from "~/actions/departamentos";

interface DeleteDepartamentoButtonProps {
  departamentoId: string;
  departamentoNome: string;
}

export function DeleteDepartamentoButton({
  departamentoId,
  departamentoNome,
}: DeleteDepartamentoButtonProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteDepartamento(departamentoId);

      if (result.success) {
        toast.success(result.message ?? "Departamento excluído com sucesso.");
        setIsConfirming(false);
      } else {
        toast.error(result.message ?? "Erro ao excluir departamento.");
        setIsConfirming(false);
      }
    });
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
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
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={() => setIsConfirming(true)}
      title={`Excluir departamento ${departamentoNome}`}
      aria-label={`Excluir departamento ${departamentoNome}`}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
