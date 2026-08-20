import mammoth from "mammoth";
import { storage } from "~/lib/storage";
import { agenteConfigRepository } from "~/server/db/repositories/agente-config";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import { decryptCredential } from "~/lib/agents/crypto";
import { gerarRespostaEstruturada } from "~/lib/agents/gemini-client";
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

const nullableDateString = { anyOf: [{ type: "string", format: "date" }, { type: "null" }] };

/** LinkedIn/portfólio: normalização de esquema ausente é tratada em candidato.ts (optionalUrlSchema). */
const nullableUrlString = { anyOf: [{ type: "string", format: "uri", maxLength: 255 }, { type: "null" }] };

const itemFormacao = {
  type: "object",
  properties: {
    titulo: stringSchema(150),
    instituicao: nullableStringSchema(150),
    areaFormacao: stringSchema(120),
    dataInicio: { type: "string", format: "date" },
    dataTermino: nullableDateString,
  },
  required: ["titulo", "areaFormacao", "dataInicio"],
};

const itemExperiencia = {
  type: "object",
  properties: {
    empresa: nullableStringSchema(150),
    cargoTitulo: stringSchema(150),
    descricao: nullableStringSchema(),
    dataEntrada: { type: "string", format: "date" },
    dataSaida: nullableDateString,
  },
  required: ["cargoTitulo", "dataEntrada"],
};

const itemCertificacao = {
  type: "object",
  properties: {
    titulo: stringSchema(150),
    obtidaEm: nullableDateString,
    validade: nullableDateString,
  },
  required: ["titulo"],
};

const EXTRACAO_CURRICULO_JSON_SCHEMA = {
  type: "object",
  properties: {
    nome: stringSchema(150),
    nomeSocial: nullableStringSchema(150),
    nacionalidade: stringSchema(60),
    dataNascimento: nullableDateString,
    estadoCivil: {
      type: "string",
      enum: ["nao_informado", "solteiro", "casado", "divorciado", "viuvo", "uniao_estavel"],
    },
    pcd: nullableStringSchema(),
    // Nem todo currículo traz e-mail — deixar nullable evita que o modelo
    // "invente" um valor só pra satisfazer um campo obrigatório (ex: a string
    // "nao informado", que não é um e-mail válido). O placeholder único é
    // gerado em código quando isso acontece — ver processarArquivoLote.
    email: nullableStringSchema(254),
    celular: stringSchema(20),
    cep: nullableStringSchema(9),
    uf: { type: "string", enum: [...BRAZILIAN_UFS] },
    cidade: stringSchema(100),
    bairro: nullableStringSchema(100),
    logradouro: nullableStringSchema(200),
    resumoProfissional: stringSchema(),
    cnh: { anyOf: [{ type: "string", enum: ["a", "b", "ab", "c", "d", "e"] }, { type: "null" }] },
    possuiVeiculo: { type: "boolean" },
    ensinoMedioConcluido: { type: "boolean" },
    disponivelViagens: { type: "boolean" },
    disponivelMudanca: { type: "boolean" },
    disponibilidadeHorarios: nullableStringSchema(),
    inicioImediato: { type: "boolean" },
    linkedin: nullableUrlString,
    portfolio: nullableUrlString,
    textoCurriculoExtraido: {
      type: "string",
      description: "Transcrição do texto do currículo feita pelo próprio modelo (ADR-0001, emenda ADR-0007).",
    },
    formacoes: { type: "array", items: itemFormacao },
    experiencias: { type: "array", items: itemExperiencia },
    certificacoes: { type: "array", items: itemCertificacao },
  },
  required: [
    "nome",
    "celular",
    "uf",
    "cidade",
    "resumoProfissional",
    "textoCurriculoExtraido",
    "formacoes",
    "experiencias",
    "certificacoes",
  ],
};

const AGENT_PROVIDER = "google_ai_studio";

export async function executarExtracaoCurriculo(
  fileKey: string,
): Promise<ExtracaoCurriculoOutput> {
  const [config, credencial, arquivoBuffer] = await Promise.all([
    agenteConfigRepository.findBySlot("extracao_curriculo"),
    llmCredencialRepository.findActiveByProvider(AGENT_PROVIDER),
    storage.read(fileKey),
  ]);

  if (!config?.ativo) {
    throw new Error("Agente extracao_curriculo não está configurado/ativo.");
  }
  if (!credencial) {
    throw new Error(`Nenhuma credencial ativa para o provider "${AGENT_PROVIDER}".`);
  }

  const ext = fileKey.split(".").pop()?.toLowerCase();

  // DOCX não é lido nativamente pelo Gemini como PDF/imagem — convertido para
  // texto puro via mammoth (ADR-0007) e enviado como texto, não multimodal.
  if (ext === "docx") {
    const { value: textoDocx } = await mammoth.extractRawText({ buffer: arquivoBuffer });
    return gerarRespostaEstruturada({
      apiKey: decryptCredential(credencial.apiKeyCifrada),
      model: config.model,
      systemPrompt: config.systemPrompt,
      userPrompt: `${config.userPrompt}\n\nTexto do currículo (convertido de DOCX):\n${textoDocx}`,
      responseJsonSchema: EXTRACAO_CURRICULO_JSON_SCHEMA,
      responseZodSchema: extracaoCurriculoOutputSchema,
    });
  }

  const mimeType = inferMimeTypeMultimodal(ext);
  return gerarRespostaEstruturada({
    apiKey: decryptCredential(credencial.apiKeyCifrada),
    model: config.model,
    systemPrompt: config.systemPrompt,
    userPrompt: config.userPrompt,
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
      throw new Error(`Extensão de arquivo não suportada para extração: "${ext}".`);
  }
}
