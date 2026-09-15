import { describe, expect, it } from "vitest";
import {
  AGENDAMENTO_FIELD_BY_ETAPA,
  isEtapaAgendavel,
  splitDataHora,
  toDatetimeLocalValue,
} from "~/lib/triagem-format";

describe("agendamento por etapa", () => {
  it("marca como agendáveis apenas testes e as duas entrevistas", () => {
    expect(Object.keys(AGENDAMENTO_FIELD_BY_ETAPA)).toEqual([
      "testes",
      "entrevista_rh",
      "entrevista_gestor",
    ]);
    expect(isEtapaAgendavel("testes")).toBe(true);
    expect(isEtapaAgendavel("entrevista_gestor")).toBe(true);
    expect(isEtapaAgendavel("curriculo")).toBe(false);
    expect(isEtapaAgendavel("finalizado")).toBe(false);
  });
});

describe("splitDataHora", () => {
  it("separa data e hora do formato devolvido pelo Postgres", () => {
    expect(splitDataHora("2026-09-16 14:30:00")).toEqual({
      data: "16/09/2026",
      hora: "14:30",
    });
  });

  it("aceita também o formato com T", () => {
    expect(splitDataHora("2026-09-16T08:05:00")).toEqual({
      data: "16/09/2026",
      hora: "08:05",
    });
  });

  it("não desloca a hora pelo fuso do ambiente", () => {
    // Um `Date` interpretaria "2026-01-01 23:30" no fuso local e poderia virar
    // o dia; a leitura por partes preserva o horário combinado.
    expect(splitDataHora("2026-01-01 23:30:00")).toEqual({
      data: "01/01/2026",
      hora: "23:30",
    });
  });

  it("devolve strings vazias para valores ausentes ou inválidos", () => {
    expect(splitDataHora(null)).toEqual({ data: "", hora: "" });
    expect(splitDataHora(undefined)).toEqual({ data: "", hora: "" });
    expect(splitDataHora("amanhã às 14h")).toEqual({ data: "", hora: "" });
  });
});

describe("toDatetimeLocalValue", () => {
  it("converte o timestamp do banco no valor do input datetime-local", () => {
    expect(toDatetimeLocalValue("2026-09-16 14:30:00")).toBe(
      "2026-09-16T14:30",
    );
  });

  it("devolve string vazia quando não há agendamento", () => {
    expect(toDatetimeLocalValue(null)).toBe("");
  });
});
