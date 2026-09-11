import { z } from "zod";
import { normalizarCelular } from "~/lib/celular";
import {
  uuidSchema,
  nonEmptyString,
  trimmedString,
  emailSchema,
  ufSchema,
  dateStringSchema,
  optionalDateStringSchema,
} from "./common";

export const estadoCivilSchema = z.enum(
  [
    "nao_informado",
    "solteiro",
    "casado",
    "divorciado",
    "viuvo",
    "uniao_estavel",
  ],
  { required_error: "Estado civil é obrigatório" },
);

// Tri-state, como os flags booleanos: uma categoria (a/b/ab/c/d/e) = declarada;
// "nenhuma" = declarou não ter CNH; null (coluna nullable) = não mencionado.
export const cnhSchema = z.enum(["a", "b", "ab", "c", "d", "e", "nenhuma"], {
  required_error: "CNH é obrigatória",
});

export const origemSchema = z.enum(["email", "manual", "indicacao"], {
  required_error: "Origem é obrigatória",
});

/**
 * Currículos costumam trazer o CEP com pontuação de milhar (ex: "75.709-400",
 * 10 caracteres) em vez do formato padrão "75709-400" (9). O modelo de IA
 * transcreve o texto-fonte fielmente — inclusive essa formatação — então a
 * validação normaliza (remove tudo que não for dígito ou hífen) em vez de
 * rejeitar, igual já é feito com URL abaixo.
 */
const cepSchema = z.preprocess(
  (val) => {
    if (typeof val !== "string") return val ?? null;
    const cleaned = val.replace(/[^\d-]/g, "").trim();
    return cleaned === "" ? null : cleaned;
  },
  trimmedString.max(9, "O CEP deve ter no máximo 9 caracteres").nullable(),
);

/**
 * Texto opcional que normaliza string vazia/espaços, `undefined` e `null` para
 * `null`, garantindo saída `string | null` (nunca `undefined`). Usado em campos
 * de endereço que deixaram de ser obrigatórios.
 */
const nullableTrimmedString = (max: number, maxMessage: string) =>
  z.preprocess(
    (val) =>
      val == null || (typeof val === "string" && val.trim() === "")
        ? null
        : val,
    trimmedString.max(max, maxMessage).nullable(),
  );

/**
 * Currículos e cadastros trazem o celular em formatos variados ("(11) 98765-4321",
 * "+55 11 98765 4321", "11987654321"). Como o dedup casa por igualdade exata
 * (`eq(candidatos.celular, ...)`), o valor é reduzido à forma canônica (só
 * dígitos, DDD + 9) por `normalizarCelular` antes de validar — normalização, não
 * validação de conteúdo, igual ao CEP acima. A formatação de exibição
 * (XX) XXXXX-XXXX é responsabilidade do frontend (ver ~/lib/celular).
 */
const celularSchema = z.preprocess(
  (val) => (typeof val === "string" ? normalizarCelular(val) : (val ?? null)),
  trimmedString.max(20, "O celular deve ter no máximo 20 caracteres").nullable(),
);

const ABSOLUTE_URL_SCHEME_REGEX = /^https?:\/\//i;

/**
 * Currículos e cadastros manuais costumam trazer LinkedIn/portfólio sem o
 * esquema (ex: "linkedin.com/in/fulano"), que `.url()` rejeita por não ser
 * uma URL absoluta. Assume-se "https://" quando o esquema está ausente, em
 * vez de rejeitar — normalização, não validação de conteúdo.
 */
const optionalUrlSchema = z.preprocess(
  (val) => {
    if (typeof val !== "string") return val;
    const trimmed = val.trim();
    if (trimmed === "") return null;
    return ABSOLUTE_URL_SCHEME_REGEX.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
  },
  z
    .string()
    .trim()
    .url({ message: "URL inválida" })
    .max(255, "A URL deve ter no máximo 255 caracteres")
    .optional()
    .nullable(),
);

export const formacaoBaseSchema = z.object({
  id: uuidSchema.optional(),
  titulo: nonEmptyString("O título da formação é obrigatório").max(
    150,
    "O título deve ter no máximo 150 caracteres",
  ),
  instituicao: trimmedString
    .max(150, "A instituição deve ter no máximo 150 caracteres")
    .optional()
    .nullable(),
  areaFormacao: nonEmptyString("A área de formação é obrigatória").max(
    120,
    "A área deve ter no máximo 120 caracteres",
  ),
  dataInicio: optionalDateStringSchema,
  dataTermino: optionalDateStringSchema,
});

export const formacaoSchema = formacaoBaseSchema.refine(
  (data) => {
    if (data.dataInicio && data.dataTermino) {
      return new Date(data.dataInicio) <= new Date(data.dataTermino);
    }
    return true;
  },
  {
    message: "A data de término deve ser posterior ou igual à data de início",
    path: ["dataTermino"],
  },
);

export type FormacaoInput = z.input<typeof formacaoSchema>;
export type FormacaoOutput = z.output<typeof formacaoSchema>;

export const experienciaBaseSchema = z.object({
  id: uuidSchema.optional(),
  empresa: trimmedString
    .max(150, "O nome da empresa deve ter no máximo 150 caracteres")
    .optional()
    .nullable(),
  cargoTitulo: nonEmptyString("O título do cargo é obrigatório").max(
    150,
    "O título do cargo deve ter no máximo 150 caracteres",
  ),
  descricao: trimmedString.optional().nullable(),
  dataEntrada: optionalDateStringSchema,
  dataSaida: optionalDateStringSchema,
});

export const experienciaSchema = experienciaBaseSchema.refine(
  (data) => {
    if (data.dataEntrada && data.dataSaida) {
      return new Date(data.dataEntrada) <= new Date(data.dataSaida);
    }
    return true;
  },
  {
    message: "A data de saída deve ser posterior ou igual à data de entrada",
    path: ["dataSaida"],
  },
);

export type ExperienciaInput = z.input<typeof experienciaSchema>;
export type ExperienciaOutput = z.output<typeof experienciaSchema>;

export const certificacaoBaseSchema = z.object({
  id: uuidSchema.optional(),
  titulo: nonEmptyString("O título da certificação é obrigatório").max(
    150,
    "O título deve ter no máximo 150 caracteres",
  ),
  obtidaEm: dateStringSchema.optional().nullable(),
  validade: dateStringSchema.optional().nullable(),
});

export const certificacaoSchema = certificacaoBaseSchema.refine(
  (data) => {
    if (data.obtidaEm && data.validade) {
      return new Date(data.obtidaEm) <= new Date(data.validade);
    }
    return true;
  },
  {
    message: "A validade deve ser posterior ou igual à data de obtenção",
    path: ["validade"],
  },
);

export type CertificacaoInput = z.input<typeof certificacaoSchema>;
export type CertificacaoOutput = z.output<typeof certificacaoSchema>;

export const candidatoSchema = z.object({
  id: uuidSchema.optional(),
  nome: nonEmptyString("O nome é obrigatório").max(
    150,
    "O nome deve ter no máximo 150 caracteres",
  ),
  nomeSocial: trimmedString
    .max(150, "O nome social deve ter no máximo 150 caracteres")
    .optional()
    .nullable(),
  nacionalidade: trimmedString
    .max(60, "A nacionalidade deve ter no máximo 60 caracteres")
    .default("brasileira"),
  dataNascimento: optionalDateStringSchema,
  estadoCivil: estadoCivilSchema.default("nao_informado"),
  pcd: trimmedString.optional().nullable(),
  email: emailSchema
    .max(254, "O e-mail deve ter no máximo 254 caracteres")
    .optional()
    .nullable(),
  celular: celularSchema,
  cep: cepSchema,
  uf: ufSchema,
  cidade: nonEmptyString("A cidade é obrigatória").max(
    100,
    "A cidade deve ter no máximo 100 caracteres",
  ),
  bairro: nullableTrimmedString(
    100,
    "O bairro deve ter no máximo 100 caracteres",
  ),
  logradouro: nullableTrimmedString(
    200,
    "O logradouro deve ter no máximo 200 caracteres",
  ),
  resumoProfissional: nonEmptyString("O resumo profissional é obrigatório"),
  cnh: cnhSchema.optional().nullable(),
  // Tri-state (true/false/null): null = não declarado. `.default(null)`
  // converte a chave ausente (undefined) em null, mantendo a saída
  // `boolean | null` alinhada às colunas nuláveis correspondentes.
  possuiVeiculo: z.boolean().nullable().default(null),
  ensinoMedioConcluido: z.boolean().nullable().default(null),
  cargoInteresseId: uuidSchema.optional().nullable(),
  areaInteresseId: uuidSchema.optional().nullable(),
  disponivelViagens: z.boolean().nullable().default(null),
  disponivelMudanca: z.boolean().nullable().default(null),
  disponibilidadeHorarios: trimmedString.optional().nullable(),
  inicioImediato: z.boolean().nullable().default(null),
  linkedin: optionalUrlSchema,
  portfolio: optionalUrlSchema,
  origem: origemSchema.default("manual"),
  curriculoArquivoKey: trimmedString.optional().nullable(),
  textoCurriculoExtraido: trimmedString.optional().nullable(),
  dadosPendentes: trimmedString.optional().nullable(),
  observacoesRh: trimmedString.optional().nullable(),
});

export type CandidatoInput = z.input<typeof candidatoSchema>;
export type CandidatoOutput = z.output<typeof candidatoSchema>;

export const candidatoAgregadoSchema = candidatoSchema.extend({
  formacoes: z.array(formacaoSchema).default([]),
  experiencias: z.array(experienciaSchema).default([]),
  certificacoes: z.array(certificacaoSchema).default([]),
});

export type CandidatoAgregadoInput = z.input<typeof candidatoAgregadoSchema>;
export type CandidatoAgregadoOutput = z.output<typeof candidatoAgregadoSchema>;

/**
 * Mensagem exibida quando nem e-mail nem celular são informados.
 */
export const CONTATO_OBRIGATORIO_MESSAGE =
  "Informe ao menos um e-mail ou celular.";

/**
 * Versão refinada do schema agregado para uso no formulário e nas Server
 * Actions: além das regras de campo, exige ao menos um meio de contato
 * (e-mail OU celular). Mantida separada de `candidatoAgregadoSchema` (que
 * continua sendo um `ZodObject` puro) porque `.refine()` produz um
 * `ZodEffects`, incompatível com os usos de `.shape`/`.extend` em outros
 * pontos (ex.: `extracao-curriculo.ts` e o próprio form).
 */
export const candidatoFormSchema = candidatoAgregadoSchema.superRefine(
  (data, ctx) => {
    if (!data.email && !data.celular) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: CONTATO_OBRIGATORIO_MESSAGE,
        path: ["email"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: CONTATO_OBRIGATORIO_MESSAGE,
        path: ["celular"],
      });
    }
  },
);

export type CandidatoFormInput = z.input<typeof candidatoFormSchema>;
export type CandidatoFormOutput = z.output<typeof candidatoFormSchema>;
