import mammoth from "mammoth";
import { storage } from "~/lib/storage";
import { agenteConfigRepository } from "~/server/db/repositories/agente-config";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import { decryptCredential } from "~/lib/agents/crypto";
import { gerarRespostaEstruturada } from "~/lib/agents/gemini-client";
import {
  extracaoCurriculoOutputSchema,
  type ExtracaoCurriculoOutput,
} from "~/lib/validation/extracao-curriculo";

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };

const itemFormacao = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    instituicao: nullableString,
    areaFormacao: { type: "string" },
    dataInicio: { type: "string", format: "date" },
    dataTermino: nullableString,
  },
  required: ["titulo", "areaFormacao", "dataInicio"],
};

const itemExperiencia = {
  type: "object",
  properties: {
    empresa: nullableString,
    cargoTitulo: { type: "string" },
    descricao: nullableString,
    dataEntrada: { type: "string", format: "date" },
    dataSaida: nullableString,
  },
  required: ["cargoTitulo", "dataEntrada"],
};

const itemCertificacao = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    obtidaEm: nullableString,
    validade: nullableString,
  },
  required: ["titulo"],
};

const EXTRACAO_CURRICULO_JSON_SCHEMA = {
  type: "object",
  properties: {
    nome: { type: "string" },
    nomeSocial: nullableString,
    nacionalidade: { type: "string" },
    dataNascimento: nullableString,
    estadoCivil: {
      type: "string",
      enum: ["nao_informado", "solteiro", "casado", "divorciado", "viuvo", "uniao_estavel"],
    },
    pcd: nullableString,
    email: { type: "string" },
    celular: { type: "string" },
    cep: nullableString,
    uf: { type: "string" },
    cidade: { type: "string" },
    bairro: nullableString,
    logradouro: nullableString,
    resumoProfissional: { type: "string" },
    cnh: { anyOf: [{ type: "string", enum: ["a", "b", "ab", "c", "d", "e"] }, { type: "null" }] },
    possuiVeiculo: { type: "boolean" },
    ensinoMedioConcluido: { type: "boolean" },
    disponivelViagens: { type: "boolean" },
    disponivelMudanca: { type: "boolean" },
    disponibilidadeHorarios: nullableString,
    inicioImediato: { type: "boolean" },
    linkedin: nullableString,
    portfolio: nullableString,
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
    "email",
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
