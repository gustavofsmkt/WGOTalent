import { describe, it, expect } from "vitest";
import {
  triagemSchema,
  triagemBaseSchema,
  updateTriagemSchema,
  motivosReprovacao,
  motivosDesistencia,
} from "~/lib/validation/triagem";

describe("TriagemForm - Validation Integration", () => {
  const validCandidatoId = "11111111-1111-1111-1111-111111111111";
  const validVagaId = "22222222-2222-2222-2222-222222222222";

  it("valida criação de triagem com dados válidos em andamento", () => {
    const input = {
      candidatoId: validCandidatoId,
      vagaId: validVagaId,
      etapa: "curriculo" as const,
      resultado: "em_andamento" as const,
      parecerRhCurriculo: "Candidato alinhado com o perfil",
    };

    const result = triagemSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.candidatoId).toBe(validCandidatoId);
      expect(result.data.vagaId).toBe(validVagaId);
      expect(result.data.etapa).toBe("curriculo");
      expect(result.data.resultado).toBe("em_andamento");
      expect(result.data.motivo).toBeUndefined();
    }
  });

  it("exige motivo válido quando candidato é reprovado", () => {
    const semMotivo = {
      candidatoId: validCandidatoId,
      vagaId: validVagaId,
      etapa: "entrevista_rh" as const,
      resultado: "reprovado" as const,
    };

    const resultSemMotivo = triagemSchema.safeParse(semMotivo);
    expect(resultSemMotivo.success).toBe(false);

    const comMotivoValido = {
      ...semMotivo,
      motivo: "fit_cultural" as const,
    };
    const resultValido = triagemSchema.safeParse(comMotivoValido);
    expect(resultValido.success).toBe(true);

    const comMotivoInvalido = {
      ...semMotivo,
      motivo: "incompatibilidade_salarial" as const, // motivo de desistencia, invalido para reprovacao
    };
    const resultInvalido = triagemSchema.safeParse(comMotivoInvalido);
    expect(resultInvalido.success).toBe(false);
  });

  it("exige motivo válido quando candidato é desistente", () => {
    const semMotivo = {
      candidatoId: validCandidatoId,
      vagaId: validVagaId,
      etapa: "entrevista_gestor" as const,
      resultado: "desistente" as const,
    };

    const resultSemMotivo = triagemSchema.safeParse(semMotivo);
    expect(resultSemMotivo.success).toBe(false);

    const comMotivoValido = {
      ...semMotivo,
      motivo: "aceitou_outra_proposta" as const,
    };
    const resultValido = triagemSchema.safeParse(comMotivoValido);
    expect(resultValido.success).toBe(true);

    const comMotivoInvalido = {
      ...semMotivo,
      motivo: "fit_cultural" as const, // motivo de reprovacao, invalido para desistencia
    };
    const resultInvalido = triagemSchema.safeParse(comMotivoInvalido);
    expect(resultInvalido.success).toBe(false);
  });

  it("valida os esquemas dos campos individuais utilizados no onBlur do form", () => {
    expect(triagemBaseSchema.shape.candidatoId.safeParse(validCandidatoId).success).toBe(true);
    expect(triagemBaseSchema.shape.candidatoId.safeParse("invalido").success).toBe(false);

    expect(triagemBaseSchema.shape.vagaId.safeParse(validVagaId).success).toBe(true);
    expect(triagemBaseSchema.shape.vagaId.safeParse("").success).toBe(false);

    expect(triagemBaseSchema.shape.etapa.safeParse("entrevista_rh").success).toBe(true);
    expect(triagemBaseSchema.shape.etapa.safeParse("etapa_inexistente").success).toBe(false);

    expect(triagemBaseSchema.shape.resultado.safeParse("aprovado").success).toBe(true);
    expect(triagemBaseSchema.shape.resultado.safeParse("resultado_inexistente").success).toBe(false);
  });

  it("valida o updateTriagemSchema sem exigir candidatoId e vagaId", () => {
    const updateInput = {
      etapa: "finalizado" as const,
      resultado: "aprovado" as const,
      parecerRhFinalizado: "Aprovado na entrevista com a diretoria.",
    };

    const result = updateTriagemSchema.safeParse(updateInput);
    expect(result.success).toBe(true);
  });
});
