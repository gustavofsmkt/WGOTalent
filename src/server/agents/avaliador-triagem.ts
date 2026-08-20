import { z } from "zod";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { agenteConfigRepository } from "~/server/db/repositories/agente-config";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import { decryptCredential } from "~/lib/agents/crypto";
import { gerarRespostaEstruturada } from "~/lib/agents/gemini-client";
import { resolveTemplate } from "~/lib/agents/template";
import { type NovaAvaliacaoIA } from "~/server/db/schema";

const AGENT_PROVIDER = "google_ai_studio";

const avaliacaoOutputSchema = z.object({
  vagaFoiInferida: z.boolean(),
  pontosFortes: z.string(),
  requisitosFaltantes: z.string(),
  eliminatoriosFalhos: z.string(),
  alertas: z.string(),
  scoreIa: z.number().min(0).max(100),
  parecerIa: z.string(),
});

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    vagaFoiInferida: { type: "boolean" },
    pontosFortes: { type: "string" },
    requisitosFaltantes: { type: "string" },
    eliminatoriosFalhos: { type: "string" },
    alertas: { type: "string" },
    scoreIa: { type: "number" },
    parecerIa: { type: "string" },
  },
  required: [
    "vagaFoiInferida",
    "pontosFortes",
    "requisitosFaltantes",
    "eliminatoriosFalhos",
    "alertas",
    "scoreIa",
    "parecerIa",
  ],
};

export async function executarAvaliadorTriagem(
  triagemId: string,
): Promise<NovaAvaliacaoIA> {
  const [config, credencial, triagem] = await Promise.all([
    agenteConfigRepository.findBySlot("avaliador_triagem"),
    llmCredencialRepository.findActiveByProvider(AGENT_PROVIDER),
    triagemRepository.findByIdWithJoins(triagemId),
  ]);

  if (!config?.ativo) {
    throw new Error("Agente avaliador_triagem não está configurado/ativo.");
  }
  if (!credencial) {
    throw new Error(`Nenhuma credencial ativa para o provider "${AGENT_PROVIDER}".`);
  }
  if (!triagem) {
    throw new Error(`Triagem "${triagemId}" não encontrada.`);
  }

  const variaveis = {
    candidato: triagem.candidato,
    vaga: triagem.vaga,
  };

  const systemPrompt = resolveTemplate(config.systemPrompt, variaveis);
  const userPrompt = resolveTemplate(config.userPrompt, variaveis);

  const resultado = await gerarRespostaEstruturada({
    apiKey: decryptCredential(credencial.apiKeyCifrada),
    model: config.model,
    systemPrompt,
    userPrompt,
    responseJsonSchema: RESPONSE_JSON_SCHEMA,
    responseZodSchema: avaliacaoOutputSchema,
  });

  return { ...resultado, triagemId, scoreIa: resultado.scoreIa.toString() };
}
