import mammoth from "mammoth";
import { storage } from "~/lib/storage";
import { agenteConfigRepository } from "~/server/db/repositories/agente-config";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import { decryptCredential } from "~/lib/agents/crypto";
import { gerarRespostaEstruturada } from "~/lib/agents/agent-client";
import { resolveTemplate } from "~/lib/agents/template";
import { BRAZILIAN_UFS } from "~/lib/validation/common";
import {
  extracaoCurriculoOutputSchema,
  type ExtracaoCurriculoOutput,
} from "~/lib/validation/extracao-curriculo";

/**
 * `maxLength` abaixo espelha os `.max()` do Zod em candidato.ts — sem esse
 * hint o modelo não tem como saber o limite e o texto extraído (ex: um cargo
 * com nome longo) pode estourar a validação e derrubar o cadastro inteiro.
 */
function stringSchema(maxLength?: number) {
  return maxLength ? { type: "string", maxLength } : { type: "string" };
}

function nullableStringSchema(maxLength?: number) {
  return { anyOf: [stringSchema(maxLength), { type: "null" }] };
}

function nullableBooleanSchema() {
  return { anyOf: [{ type: "boolean" }, { type: "null" }] };
}

function nullableEnumSchema(values: readonly string[]) {
  return { anyOf: [{ type: "string", enum: [...values] }, { type: "null" }] };
}

const nullableDateString = {
  anyOf: [{ type: "string", format: "date" }, { type: "null" }],
};

/**
 * LinkedIn/portfólio: sem `format: "uri"` de propósito — a OpenAI rejeita
 * esse valor de `format` em modo strict ("'uri' is not a valid format",
 * confirmado batendo na API real em 2026-08-24; só date-time/time/date/
 * duration/email/hostname/ipv4/ipv6/uuid são aceitos lá). A validação de
 * URL de verdade já acontece em candidato.ts (optionalUrlSchema), que
 * inclusive normaliza esquema ausente — este schema é só uma dica pro
 * modelo, não a fronteira de validação.
 */
const nullableUrlString = {
  anyOf: [{ type: "string", maxLength: 255 }, { type: "null" }],
};

/**
 * `additionalProperties: false` + todo campo em `required` (nulável quando
 * pode faltar): não é exigência do Gemini, mas é do modo strict de
 * Structured Outputs de outros provedores (ex: OpenAI) que serão adicionados
 * depois — o Gemini aceita esse dialeto mais rígido normalmente, então um
 * único schema serve para os dois em vez de um por provedor.
 */
const itemFormacao = {
  type: "object",
  properties: {
    titulo: stringSchema(150),
    instituicao: nullableStringSchema(150),
    areaFormacao: stringSchema(120),
    // dataInicio deixou de ser obrigatória (só título e área de formação são);
    // nullable para o modelo poder omitir quando o currículo não traz a data.
    dataInicio: nullableDateString,
    dataTermino: nullableDateString,
  },
  required: [
    "titulo",
    "instituicao",
    "areaFormacao",
    "dataInicio",
    "dataTermino",
  ],
  additionalProperties: false,
};

const itemExperiencia = {
  type: "object",
  properties: {
    empresa: nullableStringSchema(150),
    cargoTitulo: stringSchema(150),
    descricao: nullableStringSchema(),
    // dataEntrada deixou de ser obrigatória (só cargo/função é); nullable para
    // o modelo poder omitir quando o currículo não traz a data.
    dataEntrada: nullableDateString,
    dataSaida: nullableDateString,
  },
  required: ["empresa", "cargoTitulo", "descricao", "dataEntrada", "dataSaida"],
  additionalProperties: false,
};

const itemCertificacao = {
  type: "object",
  properties: {
    titulo: stringSchema(150),
    obtidaEm: nullableDateString,
    validade: nullableDateString,
  },
  required: ["titulo", "obtidaEm", "validade"],
  additionalProperties: false,
};

const ESTADO_CIVIL_VALUES = [
  "nao_informado",
  "solteiro",
  "casado",
  "divorciado",
  "viuvo",
  "uniao_estavel",
] as const;

const EXTRACAO_CURRICULO_JSON_SCHEMA = {
  type: "object",
  properties: {
    nome: stringSchema(150),
    nomeSocial: nullableStringSchema(150),
    nacionalidade: nullableStringSchema(60),
    dataNascimento: nullableDateString,
    estadoCivil: nullableEnumSchema(ESTADO_CIVIL_VALUES),
    pcd: nullableStringSchema(),
    // Nem todo currículo traz e-mail ou celular — deixar nullable evita que o
    // modelo "invente" um valor só pra satisfazer um campo obrigatório (ex: a
    // string "nao informado", que não é um contato válido). A regra de negócio
    // exige apenas e-mail OU celular; o caso "sem nenhum dos dois" é tratado
    // em processar-curriculo-recebido.ts (candidato não criado).
    email: nullableStringSchema(254),
    celular: nullableStringSchema(20),
    cep: nullableStringSchema(9),
    uf: { type: "string", enum: [...BRAZILIAN_UFS] },
    cidade: stringSchema(100),
    bairro: nullableStringSchema(100),
    logradouro: nullableStringSchema(200),
    resumoProfissional: stringSchema(),
    cnh: {
      anyOf: [
        { type: "string", enum: ["a", "b", "ab", "c", "d", "e", "nenhuma"] },
        { type: "null" },
      ],
    },
    possuiVeiculo: nullableBooleanSchema(),
    ensinoMedioConcluido: nullableBooleanSchema(),
    disponivelViagens: nullableBooleanSchema(),
    disponivelMudanca: nullableBooleanSchema(),
    disponibilidadeHorarios: nullableStringSchema(),
    inicioImediato: nullableBooleanSchema(),
    linkedin: nullableUrlString,
    portfolio: nullableUrlString,
    textoCurriculoExtraido: {
      type: "string",
      description:
        "Transcrição do texto do currículo feita pelo próprio modelo (ADR-0001, emenda ADR-0007).",
    },
    formacoes: { type: "array", items: itemFormacao },
    experiencias: { type: "array", items: itemExperiencia },
    certificacoes: { type: "array", items: itemCertificacao },
  },
  required: [
    "nome",
    "nomeSocial",
    "nacionalidade",
    "dataNascimento",
    "estadoCivil",
    "pcd",
    "email",
    "celular",
    "cep",
    "uf",
    "cidade",
    "bairro",
    "logradouro",
    "resumoProfissional",
    "cnh",
    "possuiVeiculo",
    "ensinoMedioConcluido",
    "disponivelViagens",
    "disponivelMudanca",
    "disponibilidadeHorarios",
    "inicioImediato",
    "linkedin",
    "portfolio",
    "textoCurriculoExtraido",
    "formacoes",
    "experiencias",
    "certificacoes",
  ],
  additionalProperties: false,
};

/**
 * Contexto opcional do e-mail que trouxe o currículo. Só existe no fluxo de
 * captação por e-mail (o upload em lote e o cadastro manual não têm e-mail).
 */
export interface ContextoEmail {
  assunto: string | null;
  corpo: string | null;
}

/**
 * Monta o trecho de contexto do e-mail para acrescentar ao `userPrompt`. O
 * documento anexado continua sendo a fonte principal; o e-mail de candidatura
 * (formulário do site ou texto livre) entra como fonte auxiliar para preencher
 * dados pessoais, de contato e de cidade que faltem no documento — as regras de
 * precedência ficam no system prompt (seções Contato e Endereço). Retorna
 * string vazia quando não há e-mail ou o texto é vazio.
 */
function montarContextoEmail(contexto?: ContextoEmail): string {
  if (!contexto) return "";
  const partes: string[] = [];
  if (contexto.assunto?.trim()) {
    partes.push(`Assunto: ${contexto.assunto.trim()}`);
  }
  if (contexto.corpo?.trim()) {
    partes.push(`Corpo:\n${contexto.corpo.trim()}`);
  }
  if (partes.length === 0) return "";
  return (
    "\n\nE-mail de candidatura que acompanhou o documento (dados informados" +
    " pelo próprio candidato). Trate-o como fonte auxiliar conforme o system" +
    " prompt: use-o para preencher dados pessoais, de contato e de cidade que" +
    " faltem no documento, sem sobrepor o que o documento já traz:\n" +
    partes.join("\n\n")
  );
}

/**
 * Data de hoje em ISO (YYYY-MM-DD), fixada no fuso de São Paulo para não pular
 * de dia perto da meia-noite quando o servidor roda em UTC. Serve de âncora
 * para o modelo interpretar datas relativas do currículo (ex.: "atual",
 * "há 2 anos") e é exposta ao template como `{{dataAtual}}`.
 */
function dataAtualBrasil(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

export async function executarExtracaoCurriculo(
  fileKey: string,
  contextoEmail?: ContextoEmail,
): Promise<ExtracaoCurriculoOutput> {
  const [config, arquivoBuffer] = await Promise.all([
    agenteConfigRepository.findBySlot("extracao_curriculo"),
    storage.read(fileKey),
  ]);

  if (!config?.ativo) {
    throw new Error("Agente extracao_curriculo não está configurado/ativo.");
  }

  const credencial = await llmCredencialRepository.findActiveByProvider(
    config.provider,
  );
  if (!credencial) {
    throw new Error(
      `Nenhuma credencial ativa para o provider "${config.provider}".`,
    );
  }

  const variaveis = { dataAtual: dataAtualBrasil() };
  const systemPrompt = resolveTemplate(config.systemPrompt, variaveis);
  const userPrompt = resolveTemplate(config.userPrompt, variaveis);

  const ext = fileKey.split(".").pop()?.toLowerCase();
  const contexto = montarContextoEmail(contextoEmail);

  // DOCX não é lido nativamente pelo Gemini como PDF/imagem — convertido para
  // texto puro via mammoth (ADR-0007) e enviado como texto, não multimodal.
  if (ext === "docx") {
    const { value: textoDocx } = await mammoth.extractRawText({
      buffer: arquivoBuffer,
    });
    return gerarRespostaEstruturada({
      provider: config.provider,
      apiKey: decryptCredential(credencial.apiKeyCifrada),
      model: config.model,
      systemPrompt,
      userPrompt: `${userPrompt}${contexto}\n\nTexto do currículo (convertido de DOCX):\n${textoDocx}`,
      responseJsonSchema: EXTRACAO_CURRICULO_JSON_SCHEMA,
      responseZodSchema: extracaoCurriculoOutputSchema,
    });
  }

  const mimeType = inferMimeTypeMultimodal(ext);
  return gerarRespostaEstruturada({
    provider: config.provider,
    apiKey: decryptCredential(credencial.apiKeyCifrada),
    model: config.model,
    systemPrompt,
    userPrompt: `${userPrompt}${contexto}`,
    responseJsonSchema: EXTRACAO_CURRICULO_JSON_SCHEMA,
    responseZodSchema: extracaoCurriculoOutputSchema,
    arquivo: { mimeType, data: arquivoBuffer },
  });
}

function inferMimeTypeMultimodal(ext: string | undefined): string {
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      throw new Error(
        `Extensão de arquivo não suportada para extração: "${ext}".`,
      );
  }
}
