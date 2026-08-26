"use client";

import * as React from "react";
import {
  getUploadLoteAtivo,
  limparUploadLoteFinalizados,
} from "~/actions/candidatos";
import type { UploadLoteItem } from "~/server/db/schema";
import { temItemEmAndamento, temErroPendente } from "./upload-progress-status";

const POLL_INTERVAL_MS = 2000;

export interface UploadProgressContextValue {
  items: UploadLoteItem[];
  isOpen: boolean;
  /** Adiciona itens já criados no servidor (retorno de `iniciarUploadLote`) para pintura instantânea, sem esperar o próximo poll. */
  seedItems: (items: UploadLoteItem[]) => void;
  /** Remove da lista os itens já finalizados (sucesso ou erro); os em andamento permanecem. */
  limparFinalizados: () => Promise<void>;
  /** Apenas esconde o popup — não mexe no banco. Reabre sozinho se surgir um erro novo. */
  dismiss: () => void;
}

const UploadProgressContext =
  React.createContext<UploadProgressContextValue | null>(null);

export function UploadProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = React.useState<UploadLoteItem[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const fresh = await getUploadLoteAtivo();
    setItems(fresh);
    if (temErroPendente(fresh)) {
      setIsOpen(true);
    }
  }, []);

  // Rehidrata a partir do banco ao montar — cobre tanto F5 quanto o requisito
  // de reabrir o popup sempre que o usuário abre a tela, se houver erros
  // ainda não limpos.
  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!temItemEmAndamento(items)) return;
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [items, refresh]);

  const seedItems = React.useCallback((novos: UploadLoteItem[]) => {
    if (novos.length === 0) return;
    setItems((prev) => [...prev, ...novos]);
    setIsOpen(true);
  }, []);

  const limparFinalizados = React.useCallback(async () => {
    await limparUploadLoteFinalizados();
    await refresh();
  }, [refresh]);

  const dismiss = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = React.useMemo<UploadProgressContextValue>(
    () => ({ items, isOpen, seedItems, limparFinalizados, dismiss }),
    [items, isOpen, seedItems, limparFinalizados, dismiss],
  );

  return React.createElement(
    UploadProgressContext.Provider,
    { value },
    children,
  );
}

export function useUploadProgress(): UploadProgressContextValue {
  const context = React.useContext(UploadProgressContext);
  if (!context) {
    throw new Error(
      "useUploadProgress must be used within an UploadProgressProvider",
    );
  }
  return context;
}
