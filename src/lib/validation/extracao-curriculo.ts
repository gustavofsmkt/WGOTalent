import { z } from "zod";
import { candidatoAgregadoSchema } from "./candidato";

/**
 * Schema de saída do agente extracao_curriculo — mais permissivo que
 * candidatoAgregadoSchema (usado pelo form manual) porque um currículo
 * raramente traz endereço postal completo ou data de nascimento. A decisão
 * de negócio (2026-08-19) é permitir que o Candidato seja criado mesmo assim
 * e siga no fluxo normal de triagem; os campos ausentes ficam listados em
 * `dadosPendentes` para o RH completar depois. As colunas correspondentes em
 * `candidatos` ainda precisam se tornar nullable (TASK-141 aguardando essa
 * migration antes da TASK-145 poder inserir de fato).
 */
export const extracaoCurriculoOutputSchema = candidatoAgregadoSchema.extend({
  dataNascimento: candidatoAgregadoSchema.shape.dataNascimento.nullable(),
  cep: candidatoAgregadoSchema.shape.cep.nullable(),
  bairro: candidatoAgregadoSchema.shape.bairro.nullable(),
  logradouro: candidatoAgregadoSchema.shape.logradouro.nullable(),
});

export type ExtracaoCurriculoOutput = z.output<typeof extracaoCurriculoOutputSchema>;

const CAMPOS_POTENCIALMENTE_FALTANTES = [
  { campo: "dataNascimento", label: "Data de nascimento" },
  { campo: "cep", label: "CEP" },
  { campo: "bairro", label: "Bairro" },
  { campo: "logradouro", label: "Logradouro" },
] as const;

/** Calcula o texto de `dados_pendentes` a partir dos campos nulos retornados pela extração. */
export function calcularDadosPendentes(
  extraido: Pick<ExtracaoCurriculoOutput, "dataNascimento" | "cep" | "bairro" | "logradouro">,
): string | null {
  const faltantes = CAMPOS_POTENCIALMENTE_FALTANTES.filter(
    ({ campo }) => extraido[campo] === null || extraido[campo] === undefined,
  ).map(({ label }) => label);

  return faltantes.length > 0 ? faltantes.join(", ") : null;
}
