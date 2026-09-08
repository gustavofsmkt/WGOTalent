import { describe, expect, it } from "vitest";
import { parseTriagemListFilters } from "./triagem-list-filters";

describe("parseTriagemListFilters", () => {
  it("starts with only active vacancies enabled", () => {
    const result = parseTriagemListFilters({});

    expect(result.filters).toEqual({ vagaAtiva: true });
    expect(result.currentView).toBe("lista");
    expect(result.page).toBe(1);
  });

  it("parses the screening filters and allows showing inactive vacancies", () => {
    const result = parseTriagemListFilters({
      etapa: "entrevista_rh",
      resultado: "aprovado",
      motivo: "gestor",
      scoreMinimo: "72.5",
      vagaAtiva: "0",
      view: "pipeline",
      q: "Mariana",
      page: "3",
    });

    expect(result.filters).toEqual({
      etapa: "entrevista_rh",
      resultado: "aprovado",
      motivo: "gestor",
      scoreIaMinimo: 72.5,
      query: "Mariana",
    });
    expect(result.currentView).toBe("pipeline");
    expect(result.page).toBe(3);
  });

  it("keeps the route vacancy fixed and ignores a vacancy query parameter", () => {
    const result = parseTriagemListFilters(
      { vaga: "outra-vaga" },
      "vaga-da-rota",
    );

    expect(result.filters.vagaId).toBe("vaga-da-rota");
  });

  it("ignores scores outside the accepted range", () => {
    expect(
      parseTriagemListFilters({ scoreMinimo: "101" }).filters.scoreIaMinimo,
    ).toBeUndefined();
  });
});
