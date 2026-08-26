import { z } from "zod";
import { uuidSchema } from "./common";

export const triagemEtapaEnum = z.enum([
  "curriculo",
  "testes",
  "entrevista_rh",
  "entrevista_gestor",
  "finalizado",
]);

export const triagemResultadoEnum = z.enum([
  "em_andamento",
  "aprovado",
  "reprovado",
  "desistente",
  "banco_talentos",
]);

export const triagemMotivoEnum = z.enum([
  "curriculo",
  "fit_cultural",
  "testes",
  "rh",
  "gestor",
  "incompatibilidade_salarial",
  "aceitou_outra_proposta",
  "nao_atendeu_contato",
  "motivos_pessoais",
]);

export const motivosReprovacao = [
  "curriculo",
  "fit_cultural",
  "testes",
  "rh",
  "gestor",
] as const;

export const motivosDesistencia = [
  "incompatibilidade_salarial",
  "aceitou_outra_proposta",
  "nao_atendeu_contato",
  "motivos_pessoais",
] as const;

export const triagemBaseSchema = z.object({
  vagaId: uuidSchema,
  candidatoId: uuidSchema,
  etapa: triagemEtapaEnum,
  resultado: triagemResultadoEnum,
  motivo: triagemMotivoEnum.nullable().optional(),
  parecerRhCurriculo: z.string().nullable().optional(),
  parecerRhTestes: z.string().nullable().optional(),
  parecerRhEntrevistaRh: z.string().nullable().optional(),
  parecerRhEntrevistaGestor: z.string().nullable().optional(),
  parecerRhFinalizado: z.string().nullable().optional(),
});

export const updateTriagemBaseSchema = triagemBaseSchema.omit({
  candidatoId: true,
  vagaId: true,
});

type MotivoValidationInput = {
  resultado: z.infer<typeof triagemResultadoEnum>;
  motivo?: z.infer<typeof triagemMotivoEnum> | null;
};

const validateMotivo = (data: MotivoValidationInput, ctx: z.RefinementCtx) => {
  if (data.resultado === "reprovado") {
    if (!data.motivo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Motivo é obrigatório quando o candidato é reprovado",
        path: ["motivo"],
      });
    } else if (
      !(motivosReprovacao as readonly string[]).includes(data.motivo)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Motivo de reprovação inválido",
        path: ["motivo"],
      });
    }
  } else if (data.resultado === "desistente") {
    if (!data.motivo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Motivo é obrigatório quando o candidato é desistente",
        path: ["motivo"],
      });
    } else if (
      !(motivosDesistencia as readonly string[]).includes(data.motivo)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Motivo de desistência inválido",
        path: ["motivo"],
      });
    }
  } else {
    if (data.motivo !== null && data.motivo !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Motivo deve ser nulo para este resultado",
        path: ["motivo"],
      });
    }
  }
};

export const triagemSchema = triagemBaseSchema.superRefine(validateMotivo);
export const updateTriagemSchema =
  updateTriagemBaseSchema.superRefine(validateMotivo);

export type TriagemSchema = z.infer<typeof triagemSchema>;
export type CreateTriagemInput = z.infer<typeof triagemSchema>;
export type UpdateTriagemInput = z.infer<typeof updateTriagemSchema>;
export type TriagemEtapa = z.infer<typeof triagemEtapaEnum>;
export type TriagemResultado = z.infer<typeof triagemResultadoEnum>;
export type TriagemMotivo = z.infer<typeof triagemMotivoEnum>;
