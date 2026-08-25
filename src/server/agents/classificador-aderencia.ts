import { z } from "zod";
import { agenteConfigRepository } from "~/server/db/repositories/agente-config";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import { decryptCredential } from "~/lib/agents/crypto";
import { gerarRespostaEstruturada } from "~/lib/agents/agent-client";
import { resolveTemplate } from "~/lib/agents/template";
import { runWithLimit } from "~/lib/concurrency/run-with-limit";

const CHUNK_SIZE = 25;
const CONCORRENCIA = 3;

export interface ItemAderencia {
  id: string;
  resumo: string;
}

const scoreItemSchema = z.object({
  id: z.string(),
  score: z.number().min(0).max(100),
});

const resultadoClassificadorSchema = z.array(scoreItemSchema);

const RESPONSE_JSON_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      score: { type: "number" },
    },
    required: ["id", "score"],
    additionalProperties: false,
  },
};

export async function executarClassificadorAderencia(
  itemPrincipal: ItemAderencia,
  itensComparacao: ItemAderencia[],
  tipoPrincipal: string,
  tipoComparacao: string,
): Promise<{ id: string; score: number }[]> {
  const config = await agenteConfigRepository.findBySlot("classificador_aderencia");
  if (!config?.ativo) {
    throw new Error("Agente classificador_aderencia não está configurado/ativo.");
  }

  const credencial = await llmCredencialRepository.findActiveByProvider(config.provider);
  if (!credencial) {
    throw new Error(`Nenhuma credencial ativa para o provider "${config.provider}".`);
  }

  const apiKey = decryptCredential(credencial.apiKeyCifrada);
  const idsValidos = new Set(itensComparacao.map((item) => item.id));

  const chunks: ItemAderencia[][] = [];
  for (let i = 0; i < itensComparacao.length; i += CHUNK_SIZE) {
    chunks.push(itensComparacao.slice(i, i + CHUNK_SIZE));
  }

  const resultadosPorChunk = await runWithLimit(chunks, CONCORRENCIA, async (chunk) => {
    const userPrompt = resolveTemplate(config.userPrompt, {
      tipo_principal: tipoPrincipal,
      tipo_comparacao: tipoComparacao,
      item_principal: itemPrincipal,
      itens_comparacao: chunk,
    });
    const systemPrompt = resolveTemplate(config.systemPrompt, {
      tipo_principal: tipoPrincipal,
      tipo_comparacao: tipoComparacao,
    });

    return gerarRespostaEstruturada({
      provider: config.provider,
      apiKey,
      model: config.model,
      systemPrompt,
      userPrompt,
      responseJsonSchema: RESPONSE_JSON_SCHEMA,
      responseZodSchema: resultadoClassificadorSchema,
    });
  });

  return resultadosPorChunk
    .flatMap((r) => (r.ok ? r.value : []))
    .filter((item) => idsValidos.has(item.id));
}
