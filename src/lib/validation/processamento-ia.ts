import { z } from "zod";

export const PROCESSAMENTO_IA_FLUXOS = [
  "candidato_vagas",
  "vaga_candidatos",
  "ingestao_curriculo",
] as const;

export const processamentoIaFluxoSchema = z.enum(PROCESSAMENTO_IA_FLUXOS, {
  required_error: "Fluxo de IA é obrigatório",
  invalid_type_error: "Fluxo de IA inválido",
});

export type ProcessamentoIaFluxo = z.infer<typeof processamentoIaFluxoSchema>;
