"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { ProcessamentoIaFluxo } from "~/lib/validation/processamento-ia";

export type ProcessamentoFluxo = ProcessamentoIaFluxo;

interface FluxoTabsProps {
  value: ProcessamentoFluxo;
  children: React.ReactNode;
}

/**
 * Alterna a visão entre os fluxos de processamento. O fluxo ativo vive na URL
 * (`?fluxo=`) para que a paginação, também baseada em search params, permaneça
 * dentro da aba selecionada. Trocar de aba zera a página.
 */
export function FluxoTabs({ value, children }: FluxoTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const handleChange = (next: string) => {
    if (next === value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("fluxo", next);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  return (
    <Tabs value={value} onValueChange={handleChange} className="gap-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="candidato_vagas">Candidato → vagas</TabsTrigger>
        <TabsTrigger value="vaga_candidatos">Vaga → candidatos</TabsTrigger>
        <TabsTrigger value="ingestao_curriculo">Ingestão (e-mail)</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
