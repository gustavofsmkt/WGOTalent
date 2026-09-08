import {
  triagemEtapaEnum,
  triagemMotivoEnum,
  triagemResultadoEnum,
} from "~/server/db/schema";
import type { TriagemFiltros } from "~/server/db/repositories/triagem";
import { parsePage, type SearchParamsRecord } from "~/lib/pagination";

export interface TriagemListSearchParams extends SearchParamsRecord {
  etapa?: string;
  resultado?: string;
  motivo?: string;
  q?: string;
  view?: string;
  vagaAtiva?: string;
  vaga?: string;
  scoreMinimo?: string;
  page?: string;
}

function isEnumValue<T extends string>(
  values: readonly T[],
  value: string,
): value is T {
  return (values as readonly string[]).includes(value);
}

export function parseTriagemListFilters(
  searchParams: TriagemListSearchParams,
  fixedVagaId?: string,
) {
  const query = (searchParams.q ?? "").trim();
  const etapaFilter = (searchParams.etapa ?? "").trim().toLowerCase();
  const resultadoFilter = (searchParams.resultado ?? "").trim().toLowerCase();
  const motivoFilter = (searchParams.motivo ?? "").trim().toLowerCase();
  const vagaAtivaFilter = searchParams.vagaAtiva !== "0";
  const vagaFilter = (searchParams.vaga ?? "").trim();
  const scoreMinimoParam = (searchParams.scoreMinimo ?? "").trim();
  const parsedScoreMinimo = Number(scoreMinimoParam);
  const scoreMinimoFilter =
    scoreMinimoParam &&
    Number.isFinite(parsedScoreMinimo) &&
    parsedScoreMinimo >= 0 &&
    parsedScoreMinimo <= 100
      ? parsedScoreMinimo
      : undefined;

  const filters: TriagemFiltros = {};
  if (
    etapaFilter &&
    etapaFilter !== "todas" &&
    isEnumValue(triagemEtapaEnum.enumValues, etapaFilter)
  ) {
    filters.etapa = etapaFilter;
  }
  if (
    resultadoFilter &&
    resultadoFilter !== "todas" &&
    isEnumValue(triagemResultadoEnum.enumValues, resultadoFilter)
  ) {
    filters.resultado = resultadoFilter;
  }
  if (
    motivoFilter &&
    motivoFilter !== "todos" &&
    isEnumValue(triagemMotivoEnum.enumValues, motivoFilter)
  ) {
    filters.motivo = motivoFilter;
  }
  if (vagaAtivaFilter) filters.vagaAtiva = true;
  if (fixedVagaId) {
    filters.vagaId = fixedVagaId;
  } else if (vagaFilter && vagaFilter !== "todas") {
    filters.vagaId = vagaFilter;
  }
  if (scoreMinimoFilter !== undefined) {
    filters.scoreIaMinimo = scoreMinimoFilter;
  }
  if (query) filters.query = query;

  return {
    filters,
    currentView: searchParams.view === "pipeline" ? "pipeline" : "lista",
    page: parsePage(searchParams.page),
    hasActiveFilters:
      Boolean(query) ||
      Boolean(etapaFilter && etapaFilter !== "todas") ||
      Boolean(resultadoFilter && resultadoFilter !== "todas") ||
      Boolean(motivoFilter && motivoFilter !== "todos") ||
      vagaAtivaFilter ||
      scoreMinimoFilter !== undefined ||
      Boolean(!fixedVagaId && vagaFilter && vagaFilter !== "todas"),
  } as const;
}
