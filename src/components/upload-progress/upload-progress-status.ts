import type { UploadLoteItem } from "~/server/db/schema";

export function temItemEmAndamento(items: UploadLoteItem[]): boolean {
  return items.some((i) => i.status === "pendente" || i.status === "processando");
}

export function temErroPendente(items: UploadLoteItem[]): boolean {
  return items.some((i) => i.status === "erro");
}
