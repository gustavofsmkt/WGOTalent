import { z } from "zod";
import {
  uuidSchema,
  nonEmptyString,
  trimmedString,
  emailSchema,
  ufSchema,
  dateStringSchema,
} from "./common";

export const estadoCivilSchema = z.enum(
  ["nao_informado", "solteiro", "casado", "divorciado", "viuvo", "uniao_estavel"],
  { required_error: "Estado civil é obrigatório" }
);

export const cnhSchema = z.enum(["a", "b", "ab", "c", "d", "e"], {
  required_error: "CNH é obrigatória",
});

export const origemSchema = z.enum(["email", "manual", "indicacao"], {
  required_error: "Origem é obrigatória",
});

const optionalUrlSchema = z.preprocess(
  (val) => (val === "" ? null : val),
  z
    .string()
    .trim()
    .url({ message: "URL inválida" })
    .max(255, "A URL deve ter no máximo 255 caracteres")
    .optional()
    .nullable()
);

export const formacaoBaseSchema = z.object({
  id: uuidSchema.optional(),
  titulo: nonEmptyString("O título da formação é obrigatório").max(
    150,
    "O título deve ter no máximo 150 caracteres"
  ),
  instituicao: trimmedString
    .max(150, "A instituição deve ter no máximo 150 caracteres")
    .optional()
    .nullable(),
  areaFormacao: nonEmptyString("A área de formação é obrigatória").max(
    120,
    "A área deve ter no máximo 120 caracteres"
  ),
  dataInicio: dateStringSchema,
  dataTermino: dateStringSchema.optional().nullable(),
});

export const formacaoSchema = formacaoBaseSchema.refine(
  (data) => {
    if (data.dataTermino) {
      return new Date(data.dataInicio) <= new Date(data.dataTermino);
    }
    return true;
  },
  {
    message: "A data de término deve ser posterior ou igual à data de início",
    path: ["dataTermino"],
  }
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
    "O título do cargo deve ter no máximo 150 caracteres"
  ),
  descricao: trimmedString.optional().nullable(),
  dataEntrada: dateStringSchema,
  dataSaida: dateStringSchema.optional().nullable(),
});

export const experienciaSchema = experienciaBaseSchema.refine(
  (data) => {
    if (data.dataSaida) {
      return new Date(data.dataEntrada) <= new Date(data.dataSaida);
    }
    return true;
  },
  {
    message: "A data de saída deve ser posterior ou igual à data de entrada",
    path: ["dataSaida"],
  }
);

export type ExperienciaInput = z.input<typeof experienciaSchema>;
export type ExperienciaOutput = z.output<typeof experienciaSchema>;

export const certificacaoBaseSchema = z.object({
  id: uuidSchema.optional(),
  titulo: nonEmptyString("O título da certificação é obrigatório").max(
    150,
    "O título deve ter no máximo 150 caracteres"
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
  }
);

export type CertificacaoInput = z.input<typeof certificacaoSchema>;
export type CertificacaoOutput = z.output<typeof certificacaoSchema>;

export const candidatoSchema = z.object({
  id: uuidSchema.optional(),
  nome: nonEmptyString("O nome é obrigatório").max(
    150,
    "O nome deve ter no máximo 150 caracteres"
  ),
  nomeSocial: trimmedString
    .max(150, "O nome social deve ter no máximo 150 caracteres")
    .optional()
    .nullable(),
  nacionalidade: trimmedString
    .max(60, "A nacionalidade deve ter no máximo 60 caracteres")
    .default("brasileira"),
  dataNascimento: dateStringSchema,
  estadoCivil: estadoCivilSchema.default("nao_informado"),
  pcd: trimmedString.optional().nullable(),
  email: emailSchema.max(254, "O e-mail deve ter no máximo 254 caracteres"),
  celular: nonEmptyString("O celular é obrigatório").max(
    20,
    "O celular deve ter no máximo 20 caracteres"
  ),
  cep: nonEmptyString("O CEP é obrigatório").max(
    9,
    "O CEP deve ter no máximo 9 caracteres"
  ),
  uf: ufSchema,
  cidade: nonEmptyString("A cidade é obrigatória").max(
    100,
    "A cidade deve ter no máximo 100 caracteres"
  ),
  bairro: nonEmptyString("O bairro é obrigatório").max(
    100,
    "O bairro deve ter no máximo 100 caracteres"
  ),
  logradouro: nonEmptyString("O logradouro é obrigatório").max(
    200,
    "O logradouro deve ter no máximo 200 caracteres"
  ),
  resumoProfissional: nonEmptyString("O resumo profissional é obrigatório"),
  cnh: cnhSchema.optional().nullable(),
  possuiVeiculo: z.boolean().default(false),
  ensinoMedioConcluido: z.boolean().default(false),
  cargoInteresseId: uuidSchema.optional().nullable(),
  areaInteresseId: uuidSchema.optional().nullable(),
  disponivelViagens: z.boolean().default(false),
  disponivelMudanca: z.boolean().default(false),
  disponibilidadeHorarios: trimmedString.optional().nullable(),
  inicioImediato: z.boolean().default(false),
  linkedin: optionalUrlSchema,
  portfolio: optionalUrlSchema,
  origem: origemSchema.default("manual"),
  textoCurriculoExtraido: trimmedString.optional().nullable(),
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
