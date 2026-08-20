"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { deleteCredencial } from "~/actions/credenciais";

interface DeleteCredencialButtonProps {
  credencialId: string;
}

export function DeleteCredencialButton({ credencialId }: DeleteCredencialButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCredencial(credencialId);
      if (result.success) {
        toast.success(result.message ?? "Credencial excluída.");
        setIsConfirming(false);
        router.refresh();
      } else {
        toast.error(result.message ?? "Erro ao excluir credencial.");
        setIsConfirming(false);
      }
    });
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-1.5">
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
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Sim, excluir"}
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
      variant="outline"
      size="sm"
      onClick={() => setIsConfirming(true)}
      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
    >
      <Trash2 className="size-3.5 mr-1.5" />
      Excluir
    </Button>
  );
}
