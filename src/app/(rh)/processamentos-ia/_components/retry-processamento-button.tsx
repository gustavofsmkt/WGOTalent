"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { retryProcessamentoIa } from "~/actions/processamentos-ia";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";

interface RetryProcessamentoButtonProps {
  processamentoId: string;
}

export function RetryProcessamentoButton({
  processamentoId,
}: RetryProcessamentoButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleRetry() {
    setIsPending(true);
    try {
      const result = await retryProcessamentoIa(processamentoId);
      toast.add({
        type: result.success ? "success" : "error",
        description:
          result.message ??
          (result.success
            ? "Processamento concluído."
            : "Não foi possível processar novamente."),
      });
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleRetry}
    >
      {isPending ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <RefreshCw data-icon="inline-start" />
      )}
      {isPending ? "Tentando novamente…" : "Tentar novamente"}
    </Button>
  );
}
