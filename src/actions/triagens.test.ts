import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTriagem, updateTriagem, deleteTriagem } from "./triagens";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { revalidatePath } from "next/cache";
import type {
  Candidato,
  Triagem,
  TriagemCompleta,
  Vaga,
} from "~/server/db/schema";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("~/server/db/repositories/triagem", () => ({
  triagemRepository: {
    checkActiveEmAndamento: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    findByIdWithJoins: vi.fn(),
  },
}));

vi.mock("~/server/db/repositories/candidato", () => ({
  candidatoRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("~/server/db/repositories/vaga", () => ({
  vagaRepository: {
    findById: vi.fn(),
  },
}));

describe("Triagem Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTriagem", () => {
    it("deve criar uma triagem quando os dados sao validos e não há violação de regra de negócio", async () => {
      const mockCandidato = { id: "11111111-1111-1111-1111-111111111111" };
      const mockVaga = { id: "22222222-2222-2222-2222-222222222222" };
      const mockTriagem = {
        id: "triagem-123",
        candidatoId: mockCandidato.id,
        vagaId: mockVaga.id,
        etapa: "curriculo",
        resultado: "em_andamento",
      };

      vi.mocked(candidatoRepository.findById).mockResolvedValue(
        mockCandidato as unknown as Candidato,
      );
      vi.mocked(vagaRepository.findById).mockResolvedValue(
        mockVaga as unknown as Vaga,
      );
      vi.mocked(triagemRepository.checkActiveEmAndamento).mockResolvedValue(
        false,
      );
      vi.mocked(triagemRepository.create).mockResolvedValue(
        mockTriagem as unknown as Triagem,
      );

      const response = await createTriagem({
        candidatoId: mockCandidato.id,
        vagaId: mockVaga.id,
        etapa: "curriculo",
        resultado: "em_andamento",
      });

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data).toEqual(mockTriagem);
      }
      expect(triagemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          candidatoId: mockCandidato.id,
          vagaId: mockVaga.id,
          etapa: "curriculo",
          resultado: "em_andamento",
        }),
      );
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("deve retornar erro de dominio se já existir triagem em_andamento", async () => {
      const mockCandidato = { id: "11111111-1111-1111-1111-111111111111" };
      const mockVaga = { id: "22222222-2222-2222-2222-222222222222" };

      vi.mocked(candidatoRepository.findById).mockResolvedValue(
        mockCandidato as unknown as Candidato,
      );
      vi.mocked(vagaRepository.findById).mockResolvedValue(
        mockVaga as unknown as Vaga,
      );
      vi.mocked(triagemRepository.checkActiveEmAndamento).mockResolvedValue(
        true,
      );

      const response = await createTriagem({
        candidatoId: mockCandidato.id,
        vagaId: mockVaga.id,
        etapa: "curriculo",
        resultado: "em_andamento",
      });

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.message).toContain(
          "O candidato já possui uma triagem em andamento para esta vaga",
        );
      }
      expect(triagemRepository.create).not.toHaveBeenCalled();
    });

    it("deve retornar erro se candidato ou vaga não existirem", async () => {
      vi.mocked(candidatoRepository.findById).mockResolvedValue(null);
      const mockCandidatoId = "11111111-1111-1111-1111-111111111111";
      const mockVagaId = "22222222-2222-2222-2222-222222222222";

      const response = await createTriagem({
        candidatoId: mockCandidatoId,
        vagaId: mockVagaId,
        etapa: "curriculo",
        resultado: "em_andamento",
      });

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.message).toContain("Candidato não encontrado");
      }
    });

    it("deve retornar erro de validacao do zod para motivo", async () => {
      const response = await createTriagem({
        candidatoId: "33333333-3333-3333-3333-333333333333",
        vagaId: "44444444-4444-4444-4444-444444444444",
        etapa: "curriculo",
        resultado: "reprovado",
      });

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.errors).toHaveProperty("motivo");
      }
    });
  });

  describe("updateTriagem", () => {
    it("deve atualizar uma triagem quando não ha violacao", async () => {
      const mockExisting = {
        id: "triagem-123",
        resultado: "reprovado",
        candidato: { id: "cand-123" },
        vaga: { id: "vaga-123" },
      };

      vi.mocked(triagemRepository.findByIdWithJoins).mockResolvedValue(
        mockExisting as unknown as TriagemCompleta,
      );
      vi.mocked(triagemRepository.checkActiveEmAndamento).mockResolvedValue(
        false,
      );
      vi.mocked(triagemRepository.update).mockResolvedValue({
        id: "triagem-123",
        etapa: "testes",
        resultado: "em_andamento",
      } as unknown as Triagem);

      const response = await updateTriagem("triagem-123", {
        etapa: "testes",
        resultado: "em_andamento",
      });

      expect(response.success).toBe(true);
      expect(triagemRepository.update).toHaveBeenCalledWith(
        "triagem-123",
        expect.objectContaining({
          etapa: "testes",
          resultado: "em_andamento",
        }),
      );
    });

    it("encerra antecipadamente uma triagem em andamento (reprovado + motivo, etapa forçada para finalizado)", async () => {
      const mockExisting = {
        id: "triagem-123",
        etapa: "curriculo",
        resultado: "em_andamento",
        candidato: { id: "cand-123" },
        vaga: { id: "vaga-123" },
      };

      vi.mocked(triagemRepository.findByIdWithJoins).mockResolvedValue(
        mockExisting as unknown as TriagemCompleta,
      );
      vi.mocked(triagemRepository.update).mockResolvedValue({
        id: "triagem-123",
        etapa: "finalizado",
        resultado: "reprovado",
        motivo: "curriculo",
      } as unknown as Triagem);

      const response = await updateTriagem("triagem-123", {
        etapa: "finalizado",
        resultado: "reprovado",
        motivo: "curriculo",
        parecerRhCurriculo: "Perfil não aderente à vaga.",
      });

      expect(response.success).toBe(true);
      // Não chama checkActiveEmAndamento: só entra nessa checagem quando o
      // resultado alvo é "em_andamento".
      expect(triagemRepository.checkActiveEmAndamento).not.toHaveBeenCalled();
      expect(triagemRepository.update).toHaveBeenCalledWith(
        "triagem-123",
        expect.objectContaining({
          etapa: "finalizado",
          resultado: "reprovado",
          motivo: "curriculo",
        }),
      );
    });

    it("rejeita encerramento como reprovado sem motivo", async () => {
      const mockExisting = {
        id: "triagem-123",
        etapa: "curriculo",
        resultado: "em_andamento",
        candidato: { id: "cand-123" },
        vaga: { id: "vaga-123" },
      };
      vi.mocked(triagemRepository.findByIdWithJoins).mockResolvedValue(
        mockExisting as unknown as TriagemCompleta,
      );

      const response = await updateTriagem("triagem-123", {
        etapa: "finalizado",
        resultado: "reprovado",
      });

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.errors).toHaveProperty("motivo");
      }
      expect(triagemRepository.update).not.toHaveBeenCalled();
    });

    it("encerra antecipadamente como banco_talentos sem exigir motivo", async () => {
      const mockExisting = {
        id: "triagem-123",
        etapa: "entrevista_rh",
        resultado: "em_andamento",
        candidato: { id: "cand-123" },
        vaga: { id: "vaga-123" },
      };
      vi.mocked(triagemRepository.findByIdWithJoins).mockResolvedValue(
        mockExisting as unknown as TriagemCompleta,
      );
      vi.mocked(triagemRepository.update).mockResolvedValue({
        id: "triagem-123",
        etapa: "finalizado",
        resultado: "banco_talentos",
      } as unknown as Triagem);

      const response = await updateTriagem("triagem-123", {
        etapa: "finalizado",
        resultado: "banco_talentos",
        motivo: null,
        parecerRhEntrevistaRh: "Bom perfil, sem fit para esta vaga agora.",
      });

      expect(response.success).toBe(true);
      expect(triagemRepository.update).toHaveBeenCalledWith(
        "triagem-123",
        expect.objectContaining({
          etapa: "finalizado",
          resultado: "banco_talentos",
          motivo: null,
        }),
      );
    });

    it("deve bloquear update para em_andamento se já existir outra triagem em_andamento", async () => {
      const mockExisting = {
        id: "triagem-123",
        resultado: "reprovado",
        candidato: { id: "cand-123" },
        vaga: { id: "vaga-123" },
      };

      vi.mocked(triagemRepository.findByIdWithJoins).mockResolvedValue(
        mockExisting as unknown as TriagemCompleta,
      );
      vi.mocked(triagemRepository.checkActiveEmAndamento).mockResolvedValue(
        true,
      ); // ja existe uma ativa

      const response = await updateTriagem("triagem-123", {
        etapa: "testes",
        resultado: "em_andamento",
      });

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.message).toContain(
          "O candidato já possui uma triagem em andamento para esta vaga",
        );
      }
      expect(triagemRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteTriagem", () => {
    it("deve realizar o soft delete da triagem", async () => {
      const mockExisting = {
        id: "triagem-123",
        candidato: { id: "cand-123" },
        vaga: { id: "vaga-123" },
      };

      vi.mocked(triagemRepository.findByIdWithJoins).mockResolvedValue(
        mockExisting as unknown as TriagemCompleta,
      );
      vi.mocked(triagemRepository.softDelete).mockResolvedValue();

      const response = await deleteTriagem("triagem-123");

      expect(response.success).toBe(true);
      expect(triagemRepository.softDelete).toHaveBeenCalledWith("triagem-123");
      expect(revalidatePath).toHaveBeenCalled();
    });
  });
});
