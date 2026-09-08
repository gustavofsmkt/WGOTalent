"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { retryUltimasFalhasIa } from "~/actions/processamentos-ia";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "~/components/ui/toast";
import type { ProcessamentoFluxo } from "./fluxo-tabs";

interface RetryUltimasFalhasButtonProps {
  fluxo: ProcessamentoFluxo;
  falhasDisponiveis: number;
}

export function RetryUltimasFalhasButton({
  fluxo,
  falhasDisponiveis,
}: RetryUltimasFalhasButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleRetry() {
    setIsPending(true);
    try {
      const result = await retryUltimasFalhasIa(fluxo);
      toast.add({
        type: result.success ? "success" : "error",
        description:
          result.message ?? "Não foi possível iniciar as novas tentativas.",
      });
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  const tooltip =
    falhasDisponiveis > 0
      ? "Tenta novamente até 15 falhas mais recentes deste fluxo. O processamento continua em segundo plano; clique outra vez para iniciar o próximo lote."
      : "Não há falhas reprocessáveis neste fluxo.";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || falhasDisponiveis === 0}
            onClick={handleRetry}
          />
        }
      >
        {isPending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <RefreshCw data-icon="inline-start" />
        )}
        {isPending ? "Agendando…" : "Tentar novamente"}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
