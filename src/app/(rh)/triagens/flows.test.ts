import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
    AGENT_CREDENTIALS_ENCRYPTION_KEY: "01234567890123456789012345678901",
  },
}));

import {
  triagemRepository,
  type CandidatoOption,
  type VagaOption,
} from "~/server/db/repositories/triagem";
import type { TriagemCompleta } from "~/server/db/schema";

describe("Triagens Create & Edit flows - Server Component logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("busca opções ativas de candidatos e vagas para o formulário de criação", async () => {
    const mockCandidatos: CandidatoOption[] = [
      { id: "cand-1", nome: "Mariana Silva", email: "mariana@example.com" },
      { id: "cand-2", nome: "Carlos Eduardo", email: "carlos@example.com" },
    ];
    const mockVagas: VagaOption[] = [
      {
        id: "vaga-1",
        status: "aberta",
        cidade: "São Paulo",
        uf: "SP",
        cargo: {
          titulo: "Desenvolvedor Frontend",
          departamento: { nome: "Tecnologia" },
        },
      },
    ];

    vi.spyOn(triagemRepository, "findActiveCandidatoOptions").mockResolvedValueOnce(mockCandidatos);
    vi.spyOn(triagemRepository, "findActiveVagaOptions").mockResolvedValueOnce(mockVagas);

    const [candidatos, vagas] = await Promise.all([
      triagemRepository.findActiveCandidatoOptions(),
      triagemRepository.findActiveVagaOptions(),
    ]);

    expect(candidatos).toHaveLength(2);
    expect(candidatos[0]?.nome).toBe("Mariana Silva");
    expect(vagas).toHaveLength(1);
    expect(vagas[0]?.cargo.titulo).toBe("Desenvolvedor Frontend");
  });

  it("recupera a triagem com joins completos para o fluxo de edição", async () => {
    const mockTriagem: TriagemCompleta = {
      id: "triagem-1",
      candidatoId: "cand-1",
      vagaId: "vaga-1",
      etapa: "entrevista_rh",
      resultado: "em_andamento",
      motivo: null,
      parecerRh: "Candidato demonstrou excelente comunicação e interesse.",
      parecerRhData: "2025-01-15T14:30:00.000Z",
      createdAt: "2025-01-10T10:00:00.000Z",
      updatedAt: "2025-01-15T14:30:00.000Z",
      deletedAt: null,
      candidato: {
        id: "cand-1",
        nome: "Mariana Silva",
        nomeSocial: null,
        dataNascimento: "1994-06-15",
        nacionalidade: "Brasileira",
        estadoCivil: "solteiro",
        pcd: null,
        cnh: "b",
        possuiVeiculo: false,
        ensinoMedioConcluido: true,
        email: "mariana@example.com",
        celular: "(11) 98888-7777",
        linkedin: null,
        portfolio: null,
        cep: "01310-000",
        logradouro: "Av Paulista",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP",
        resumoProfissional: "Desenvolvedora com 5 anos de experiência.",
        cargoInteresseId: null,
        areaInteresseId: null,
        disponibilidadeHorarios: "Integral",
        disponivelViagens: false,
        disponivelMudanca: false,
        inicioImediato: true,
        origem: "manual",
        curriculoArquivoKey: null,
        textoCurriculoExtraido: null,
        dadosPendentes: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        deletedAt: null,
      },
      vaga: {
        id: "vaga-1",
        cargoId: "cargo-1",
        status: "aberta",
        posicoesDisponiveis: 2,
        remuneracaoOferecida: "7000.00",
        cidade: "São Paulo",
        uf: "SP",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        deletedAt: null,
        cargo: {
          id: "cargo-1",
          departamentoId: "dep-1",
          titulo: "Desenvolvedor Frontend",
          descricao: "Atuar no desenvolvimento de aplicações React",
          ativo: true,
          faixaSalarial: "6k a 8k",
          requisitos: "React, TypeScript",
          requisitosDesejaveis: "Next.js",
          criteriosEliminatorios: "Falta de experiência",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
          deletedAt: null,
          departamento: {
            id: "dep-1",
            nome: "Tecnologia",
            descricao: "Departamento de Tecnologia",
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
            deletedAt: null,
          },
        },
      },
      avaliacao_ia: null,
    };

    vi.spyOn(triagemRepository, "findByIdWithJoins").mockResolvedValueOnce(mockTriagem);

    const result = await triagemRepository.findByIdWithJoins("triagem-1");

    expect(result).not.toBeNull();
    expect(result?.candidato.nome).toBe("Mariana Silva");
    expect(result?.vaga.cargo.titulo).toBe("Desenvolvedor Frontend");
    expect(result?.etapa).toBe("entrevista_rh");
    expect(result?.resultado).toBe("em_andamento");
  });

  it("retorna null se a triagem não existir ou estiver deletada", async () => {
    vi.spyOn(triagemRepository, "findByIdWithJoins").mockResolvedValueOnce(null);

    const result = await triagemRepository.findByIdWithJoins("triagem-inexistente");
    expect(result).toBeNull();
  });
});
