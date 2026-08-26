import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import {
  mergeScalarFields,
  candidatoRepository,
  type CandidatoAgregadoInsercao,
  type DbOrTx,
} from "./candidato";
import {
  type Candidato,
  candidatos,
  candidatoFormacoes,
  candidatoExperiencias,
  candidatoCertificacoes,
  triagens,
  avaliacaoIA,
} from "~/server/db/schema";

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

function baseIncoming(
  overrides: Partial<CandidatoAgregadoInsercao> = {},
): CandidatoAgregadoInsercao {
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
  } as unknown as CandidatoAgregadoInsercao;
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
    const current = baseCandidato({
      possuiVeiculo: true,
      disponivelViagens: false,
    });
    const incoming = baseIncoming({
      possuiVeiculo: false,
      disponivelViagens: true,
    });

    const { updates, houveMudanca } = mergeScalarFields(current, incoming);

    expect(updates.possuiVeiculo).toBeUndefined();
    expect(updates.disponivelViagens).toBe(true);
    expect(houveMudanca).toBe(true);
  });

  it("ignores the sentinel 'nao_informado' estadoCivil, but applies a real one", () => {
    const current = baseCandidato({ estadoCivil: "solteiro" });
    const incoming = baseIncoming({ estadoCivil: "nao_informado" });
    expect(
      mergeScalarFields(current, incoming).updates.estadoCivil,
    ).toBeUndefined();

    const incomingComEstado = baseIncoming({ estadoCivil: "casado" });
    expect(
      mergeScalarFields(current, incomingComEstado).updates.estadoCivil,
    ).toBe("casado");
  });

  it("never changes origem", () => {
    const current = baseCandidato({ origem: "manual" });
    const incoming = baseIncoming({ origem: "email" });

    const { updates } = mergeScalarFields(current, incoming);

    expect(updates).not.toHaveProperty("origem");
  });
});

describe("candidatoRepository.softDelete (cascade)", () => {
  /**
   * Builds a fake transaction that records every `.update(table)` call so
   * assertions can check which entities were touched, without hitting a
   * real database.
   */
  function buildFakeTx(opts: {
    candidatoDeletedAt: string | null;
    triagemRows: { id: string }[];
  }) {
    const updates: { table: unknown; data: Record<string, unknown> }[] = [];
    const tx = {
      select: () => ({
        from: (table: unknown) => ({
          where: async () => {
            if (table === candidatos)
              return [{ deletedAt: opts.candidatoDeletedAt }];
            if (table === triagens) return opts.triagemRows;
            return [];
          },
        }),
      }),
      update: (table: unknown) => ({
        set: (data: Record<string, unknown>) => ({
          where: async () => {
            updates.push({ table, data });
          },
        }),
      }),
    };
    return { tx, updates };
  }

  it("cascades soft delete to formacoes, experiencias, certificacoes, avaliacaoIA and triagens", async () => {
    const { tx, updates } = buildFakeTx({
      candidatoDeletedAt: null,
      triagemRows: [{ id: "triagem-1" }, { id: "triagem-2" }],
    });
    const fakeDb = {
      transaction: async (cb: (tx: unknown) => Promise<void>) => cb(tx),
    } as unknown as DbOrTx;

    await candidatoRepository.softDelete("cand-1", fakeDb);

    const tablesUpdated = updates.map((u) => u.table);
    expect(tablesUpdated).toContain(candidatos);
    expect(tablesUpdated).toContain(candidatoFormacoes);
    expect(tablesUpdated).toContain(candidatoExperiencias);
    expect(tablesUpdated).toContain(candidatoCertificacoes);
    expect(tablesUpdated).toContain(avaliacaoIA);
    expect(tablesUpdated).toContain(triagens);
    for (const u of updates) {
      expect(u.data.deletedAt).toBeTruthy();
    }
  });

  it("skips avaliacaoIA and triagens updates when the candidato has no triagens", async () => {
    const { tx, updates } = buildFakeTx({
      candidatoDeletedAt: null,
      triagemRows: [],
    });
    const fakeDb = {
      transaction: async (cb: (tx: unknown) => Promise<void>) => cb(tx),
    } as unknown as DbOrTx;

    await candidatoRepository.softDelete("cand-1", fakeDb);

    const tablesUpdated = updates.map((u) => u.table);
    expect(tablesUpdated).toContain(candidatoFormacoes);
    expect(tablesUpdated).not.toContain(triagens);
    expect(tablesUpdated).not.toContain(avaliacaoIA);
  });

  it("is a no-op when the candidato is already soft-deleted (idempotent)", async () => {
    const { tx, updates } = buildFakeTx({
      candidatoDeletedAt: "2026-01-01T00:00:00.000Z",
      triagemRows: [{ id: "triagem-1" }],
    });
    const fakeDb = {
      transaction: async (cb: (tx: unknown) => Promise<void>) => cb(tx),
    } as unknown as DbOrTx;

    await candidatoRepository.softDelete("cand-1", fakeDb);

    expect(updates).toHaveLength(0);
  });

  it("is a no-op when the candidato does not exist", async () => {
    const updates: unknown[] = [];
    const tx = {
      select: () => ({ from: () => ({ where: async () => [] }) }),
      update: () => ({
        set: () => ({
          where: async () => {
            updates.push(1);
          },
        }),
      }),
    };
    const fakeDb = {
      transaction: async (cb: (tx: unknown) => Promise<void>) => cb(tx),
    } as unknown as DbOrTx;

    await candidatoRepository.softDelete("cand-nao-existe", fakeDb);

    expect(updates).toHaveLength(0);
  });
});
