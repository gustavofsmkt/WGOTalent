"use client";

import * as React from "react";
import { Loader2, Power } from "lucide-react";
import { toast } from "~/components/ui/toast";
import { Button } from "~/components/ui/button";
import { deactivateCredencial } from "~/actions/credenciais";

interface DeactivateCredencialButtonProps {
  credencialId: string;
}

export function DeactivateCredencialButton({
  credencialId,
}: DeactivateCredencialButtonProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleDeactivate = () => {
    startTransition(async () => {
      const result = await deactivateCredencial(credencialId);
      if (result.success) {
        toast.add({
          type: "success",
          description: result.message ?? "Credencial desativada.",
        });
      } else {
        toast.add({
          type: "error",
          description: result.message ?? "Erro ao desativar credencial.",
        });
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleDeactivate}
      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
    >
      {isPending ? (
        <Loader2 className="size-3.5 mr-2 animate-spin" />
      ) : (
        <Power className="size-3.5 mr-2" />
      )}
      Desativar
    </Button>
  );
}
