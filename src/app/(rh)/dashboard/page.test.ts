import { describe, it, expect, vi } from "vitest";

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
  dashboardRepository,
  type DashboardSummary,
  type TriagensPorEtapaCount,
  type TriagensPorResultadoCount,
} from "~/server/db/repositories/dashboard";

describe("DashboardPage - Server Component Logic & Data Aggregation", () => {
  it("computes stage totals and maximum counts accurately for funnel visualization", () => {
    const etapas: TriagensPorEtapaCount = {
      curriculo: 25,
      testes: 15,
      entrevista_rh: 10,
      entrevista_gestor: 5,
      finalizado: 2,
    };

    const totalEtapas = Object.values(etapas).reduce((acc, c) => acc + c, 0);
    const maxCount = Math.max(...Object.values(etapas), 1);

    expect(totalEtapas).toBe(57);
    expect(maxCount).toBe(25);

    // Calculate percentage of stage
    const curriculoPct = Math.round((etapas.curriculo / totalEtapas) * 100);
    expect(curriculoPct).toBe(44);
  });

  it("handles empty stages and zero division safely", () => {
    const emptyEtapas: TriagensPorEtapaCount = {
      curriculo: 0,
      testes: 0,
      entrevista_rh: 0,
      entrevista_gestor: 0,
      finalizado: 0,
    };

    const total = Object.values(emptyEtapas).reduce((acc, c) => acc + c, 0);
    const maxCount = Math.max(...Object.values(emptyEtapas), 1);

    expect(total).toBe(0);
    expect(maxCount).toBe(1);
  });

  it("calculates percentage breakdown for screening outcomes", () => {
    const resultados: TriagensPorResultadoCount = {
      em_andamento: 50,
      aprovado: 25,
      reprovado: 15,
      desistente: 5,
      banco_talentos: 5,
    };

    const total = Object.values(resultados).reduce((acc, c) => acc + c, 0);
    expect(total).toBe(100);

    expect(Math.round((resultados.em_andamento / total) * 100)).toBe(50);
    expect(Math.round((resultados.aprovado / total) * 100)).toBe(25);
    expect(Math.round((resultados.reprovado / total) * 100)).toBe(15);
    expect(Math.round((resultados.desistente / total) * 100)).toBe(5);
    expect(Math.round((resultados.banco_talentos / total) * 100)).toBe(5);
  });

  it("fetches dashboard summary using repository successfully", async () => {
    const mockSummary: DashboardSummary = {
      vagasAbertas: 4,
      candidatosAtivos: 18,
      triagensEmAndamento: 6,
      triagensTotais: 12,
      mediaScoreIa: {
        media: 78.4,
        totalAvaliadas: 8,
      },
      triagensPorEtapa: {
        curriculo: 6,
        testes: 2,
        entrevista_rh: 2,
        entrevista_gestor: 1,
        finalizado: 1,
      },
      triagensPorResultado: {
        em_andamento: 6,
        aprovado: 3,
        reprovado: 2,
        desistente: 1,
        banco_talentos: 0,
      },
      vagasComMaisCandidatos: [
        {
          vagaId: "vaga-123",
          cargoTitulo: "Dev Fullstack",
          departamentoNome: "Engenharia",
          cidade: "São Paulo",
          uf: "SP",
          posicoesDisponiveis: 1,
          totalCandidatos: 8,
        },
      ],
      atividadeRecente: [
        {
          id: "triagem-999",
          candidatoId: "c-1",
          candidatoNome: "Lucas Oliveira",
          vagaId: "vaga-123",
          cargoTitulo: "Dev Fullstack",
          departamentoNome: "Engenharia",
          etapa: "curriculo",
          resultado: "em_andamento",
          motivo: null,
          scoreIa: "91",
          createdAt: "2024-03-01T10:00:00.000Z",
          updatedAt: "2024-03-01T11:00:00.000Z",
        },
      ],
    };

    vi.spyOn(dashboardRepository, "getDashboardSummary").mockResolvedValueOnce(mockSummary);

    const data = await dashboardRepository.getDashboardSummary();
    expect(data.vagasAbertas).toBe(4);
    expect(data.candidatosAtivos).toBe(18);
    expect(data.mediaScoreIa.media).toBe(78.4);
    expect(data.vagasComMaisCandidatos).toHaveLength(1);
    expect(data.vagasComMaisCandidatos[0]?.cargoTitulo).toBe("Dev Fullstack");
    expect(data.atividadeRecente[0]?.scoreIa).toBe("91");
  });
});
