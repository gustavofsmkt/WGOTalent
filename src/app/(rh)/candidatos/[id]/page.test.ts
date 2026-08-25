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
  candidatoRepository,
  type CandidatoDetailCompleto,
} from "~/server/db/repositories/candidato";

describe("CandidatoDetailPage - Server Logic", () => {
  const mockCandidate: CandidatoDetailCompleto = {
    id: "cand-123",
    nome: "Marina Costa",
    nomeSocial: "Marina",
    dataNascimento: "1992-08-15",
    nacionalidade: "Brasileira",
    estadoCivil: "solteiro",
    pcd: null,
    cnh: "b",
    possuiVeiculo: true,
    ensinoMedioConcluido: true,
    email: "m.costa@example.com",
    celular: "(11) 98765-4321",
    linkedin: "https://linkedin.com/in/marinacosta",
    portfolio: "https://marinacosta.dev",
    cep: "01310-100",
    logradouro: "Av. Paulista",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
    resumoProfissional: "Profissional com sólida experiência em marketing.",
    cargoInteresseId: "cargo-1",
    areaInteresseId: "area-1",
    disponibilidadeHorarios: "Horário comercial",
    disponivelViagens: true,
    disponivelMudanca: false,
    inicioImediato: true,
    origem: "manual",
    emBancoTalentos: false,
    curriculoArquivoKey: "resumes/marina_cv.pdf",
    textoCurriculoExtraido: null,
    dadosPendentes: null,
    createdAt: "2023-08-01T10:00:00.000Z",
    updatedAt: "2023-08-01T10:00:00.000Z",
    deletedAt: null,
    cargoInteresse: { id: "cargo-1", titulo: "Gerente de Marketing" },
    areaInteresse: { id: "area-1", nome: "Marketing" },
    formacoes: [
      {
        id: "form-1",
        candidatoId: "cand-123",
        titulo: "Bacharelado em Publicidade",
        instituicao: "USP",
        areaFormacao: "Comunicação Social",
        dataInicio: "2010-02-01",
        dataTermino: "2014-12-15",
        createdAt: "2023-08-01T10:00:00.000Z",
        updatedAt: "2023-08-01T10:00:00.000Z",
        deletedAt: null,
      },
    ],
    experiencias: [
      {
        id: "exp-1",
        candidatoId: "cand-123",
        empresa: "Agência Digital",
        cargoTitulo: "Coordenadora de Marketing",
        descricao: "Gestão de equipe e campanhas.",
        dataEntrada: "2018-03-01",
        dataSaida: null,
        createdAt: "2023-08-01T10:00:00.000Z",
        updatedAt: "2023-08-01T10:00:00.000Z",
        deletedAt: null,
      },
    ],
    certificacoes: [
      {
        id: "cert-1",
        candidatoId: "cand-123",
        titulo: "Scrum Master PSM I",
        obtidaEm: "2021-05-10",
        validade: null,
        createdAt: "2023-08-01T10:00:00.000Z",
        updatedAt: "2023-08-01T10:00:00.000Z",
        deletedAt: null,
      },
    ],
    triagens: [
      {
        id: "triagem-1",
        candidatoId: "cand-123",
        vagaId: "vaga-1",
        etapa: "entrevista_rh",
        resultado: "em_andamento",
        motivo: null,
        parecerRhCurriculo: null,
        parecerRhTestes: null,
        parecerRhEntrevistaRh: "Excelente comunicação.",
        parecerRhEntrevistaGestor: null,
        parecerRhFinalizado: null,
        createdAt: "2023-08-02T10:00:00.000Z",
        updatedAt: "2023-08-05T14:00:00.000Z",
        deletedAt: null,
        vaga: {
          id: "vaga-1",
          cargo: { titulo: "Gerente de Marketing" },
        },
        avaliacaoIA: {
          id: "ia-1",
          scoreIa: "92.00",
          parecerIa: "Forte aderência ao perfil.",
        },
      },
    ],
  };

  it("fetches complete candidate details by id including relationships", async () => {
    vi.spyOn(candidatoRepository, "findByIdComplete").mockResolvedValueOnce(
      mockCandidate,
    );

    const result = await candidatoRepository.findByIdComplete("cand-123");
    expect(result).not.toBeNull();
    expect(result?.nome).toBe("Marina Costa");
    expect(result?.formacoes).toHaveLength(1);
    expect(result?.experiencias).toHaveLength(1);
    expect(result?.certificacoes).toHaveLength(1);
    expect(result?.triagens).toHaveLength(1);
    expect(result?.triagens[0]?.avaliacaoIA?.scoreIa).toBe("92.00");
    expect(result?.cargoInteresse?.titulo).toBe("Gerente de Marketing");
    expect(result?.areaInteresse?.nome).toBe("Marketing");
  });

  it("returns null when candidate is not found", async () => {
    vi.spyOn(candidatoRepository, "findByIdComplete").mockResolvedValueOnce(null);

    const result = await candidatoRepository.findByIdComplete("non-existent");
    expect(result).toBeNull();
  });
});
