import type { SearchParamsRecord } from "~/lib/pagination";

export interface ProcessamentoIaSearchParams extends SearchParamsRecord {
  fluxo?: string;
  page?: string;
  somenteFalhas?: string;
}

export function parseSomenteFalhas(
  value: string | string[] | undefined,
): boolean {
  return (Array.isArray(value) ? value[0] : value) === "1";
}
