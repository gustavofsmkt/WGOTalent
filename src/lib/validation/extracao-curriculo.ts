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
/**
 * nullish() (não só nullable()) porque o JSON Schema mandado ao Gemini só
 * marca esses campos como não-obrigatórios — a resposta pode trazer `null`
 * OU simplesmente omitir a chave, e um `nullable()` puro rejeita a chave
 * ausente (`undefined`) com "campo obrigatório".
 */
export const extracaoCurriculoOutputSchema = candidatoAgregadoSchema.extend({
  dataNascimento: candidatoAgregadoSchema.shape.dataNascimento.nullish(),
  cep: candidatoAgregadoSchema.shape.cep.nullish(),
  bairro: candidatoAgregadoSchema.shape.bairro.nullish(),
  logradouro: candidatoAgregadoSchema.shape.logradouro.nullish(),
  // Currículo sem e-mail visível: nullish pelo mesmo motivo dos campos
  // acima. Quem substitui por um placeholder único (nunca null/undefined)
  // antes de gravar no banco é processarArquivoLote — email é
  // NOT NULL/UNIQUE na tabela candidatos.
  email: candidatoAgregadoSchema.shape.email.nullish(),
});

export type ExtracaoCurriculoOutput = z.output<typeof extracaoCurriculoOutputSchema>;

const CAMPOS_POTENCIALMENTE_FALTANTES = [
  { campo: "dataNascimento", label: "Data de nascimento" },
  { campo: "cep", label: "CEP" },
  { campo: "bairro", label: "Bairro" },
  { campo: "logradouro", label: "Logradouro" },
  { campo: "email", label: "E-mail" },
] as const;

/** Calcula o texto de `dados_pendentes` a partir dos campos nulos retornados pela extração. */
export function calcularDadosPendentes(
  extraido: Pick<ExtracaoCurriculoOutput, "dataNascimento" | "cep" | "bairro" | "logradouro" | "email">,
): string | null {
  const faltantes = CAMPOS_POTENCIALMENTE_FALTANTES.filter(
    ({ campo }) => extraido[campo] === null || extraido[campo] === undefined,
  ).map(({ label }) => label);

  return faltantes.length > 0 ? faltantes.join(", ") : null;
}
