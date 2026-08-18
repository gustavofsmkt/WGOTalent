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

export const triagemSchema = z
  .object({
    vagaId: uuidSchema,
    candidatoId: uuidSchema,
    etapa: triagemEtapaEnum,
    resultado: triagemResultadoEnum,
    motivo: triagemMotivoEnum.nullable().optional(),
    parecerRh: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.resultado === "reprovado") {
      if (!data.motivo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Motivo é obrigatório quando o candidato é reprovado",
          path: ["motivo"],
        });
      } else if (!motivosReprovacao.includes(data.motivo as any)) {
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
      } else if (!motivosDesistencia.includes(data.motivo as any)) {
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
  });

export type TriagemSchema = z.infer<typeof triagemSchema>;