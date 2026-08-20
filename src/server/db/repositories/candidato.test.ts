import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import { mergeScalarFields } from "./candidato";
import { type Candidato } from "~/server/db/schema";

function baseCandidato(overrides: Partial<Candidato> = {}): Candidato {
  return {
    id: "cand-1",
    nome: "João Silva",
    nomeSocial: null,
    nacionalidade: "brasileira",
    dataNascimento: "1990-01-01",
    estadoCivil: "solteiro",
    pcd: null,
    email: "joao@example.com",
    celular: "11999999999",
    cep: "01000-000",
    uf: "SP",
    cidade: "São Paulo",
    bairro: "Centro",
    logradouro: "Rua Direita",
    dadosPendentes: null,
    resumoProfissional: "Desenvolvedor",
    cnh: null,
    possuiVeiculo: false,
    ensinoMedioConcluido: true,
    cargoInteresseId: null,
    areaInteresseId: null,
    disponivelViagens: false,
    disponivelMudanca: false,
    disponibilidadeHorarios: null,
    inicioImediato: false,
    linkedin: null,
    portfolio: null,
    origem: "manual",
    curriculoArquivoKey: null,
    textoCurriculoExtraido: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    ...overrides,
  } as Candidato;
}

function baseIncoming(overrides: Record<string, unknown> = {}) {
  return {
    nome: "João Silva",
    nomeSocial: null,
    nacionalidade: "brasileira",
    dataNascimento: "1990-01-01",
    estadoCivil: "nao_informado",
    pcd: null,
    email: "joao@example.com",
    celular: "11999999999",
    cep: "01000-000",
    uf: "SP",
    cidade: "São Paulo",
    bairro: "Centro",
    logradouro: "Rua Direita",
    dadosPendentes: null,
    resumoProfissional: "Desenvolvedor",
    cnh: null,
    possuiVeiculo: false,
    ensinoMedioConcluido: false,
    cargoInteresseId: null,
    areaInteresseId: null,
    disponivelViagens: false,
    disponivelMudanca: false,
    disponibilidadeHorarios: null,
    inicioImediato: false,
    linkedin: null,
    portfolio: null,
    origem: "manual",
    curriculoArquivoKey: null,
    textoCurriculoExtraido: null,
    formacoes: [],
    experiencias: [],
    certificacoes: [],
    ...overrides,
  } as any;
}

describe("mergeScalarFields", () => {
  it("does not overwrite a filled field with an empty/null value from the new submission", () => {
    const current = baseCandidato({ linkedin: "https://linkedin.com/in/joao" });
    const incoming = baseIncoming({ linkedin: null });

    const { updates, houveMudanca } = mergeScalarFields(current, incoming);

    expect(updates.linkedin).toBeUndefined();
    expect(houveMudanca).toBe(false);
  });

  it("overwrites a field when the new submission brings a different non-empty value", () => {
    const current = baseCandidato({ celular: "11999999999" });
    const incoming = baseIncoming({ celular: "11888888888" });

    const { updates, houveMudanca } = mergeScalarFields(current, incoming);

    expect(updates.celular).toBe("11888888888");
    expect(houveMudanca).toBe(true);
  });

  it("reports no change when nothing in the new submission differs", () => {
    const current = baseCandidato();
    const incoming = baseIncoming();

    const { updates, houveMudanca } = mergeScalarFields(current, incoming);

    expect(updates).toEqual({});
    expect(houveMudanca).toBe(false);
  });

  it("only turns a boolean flag on, never off, since a false incoming value is indistinguishable from unset", () => {
    const current = baseCandidato({ possuiVeiculo: true, disponivelViagens: false });
    const incoming = baseIncoming({ possuiVeiculo: false, disponivelViagens: true });

    const { updates, houveMudanca } = mergeScalarFields(current, incoming);

    expect(updates.possuiVeiculo).toBeUndefined();
    expect(updates.disponivelViagens).toBe(true);
    expect(houveMudanca).toBe(true);
  });

  it("ignores the sentinel 'nao_informado' estadoCivil, but applies a real one", () => {
    const current = baseCandidato({ estadoCivil: "solteiro" });
    const incoming = baseIncoming({ estadoCivil: "nao_informado" });
    expect(mergeScalarFields(current, incoming).updates.estadoCivil).toBeUndefined();

    const incomingComEstado = baseIncoming({ estadoCivil: "casado" });
    expect(mergeScalarFields(current, incomingComEstado).updates.estadoCivil).toBe("casado");
  });

  it("never changes origem", () => {
    const current = baseCandidato({ origem: "manual" });
    const incoming = baseIncoming({ origem: "email" });

    const { updates } = mergeScalarFields(current, incoming);

    expect(updates).not.toHaveProperty("origem");
  });
});
