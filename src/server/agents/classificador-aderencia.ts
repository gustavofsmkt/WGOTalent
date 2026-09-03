import { z } from "zod";
import { agenteConfigRepository } from "~/server/db/repositories/agente-config";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import { decryptCredential } from "~/lib/agents/crypto";
import { gerarRespostaEstruturada } from "~/lib/agents/agent-client";
import { objetoComLista } from "~/lib/agents/schema-dialect";
import { resolveTemplate } from "~/lib/agents/template";
import { runWithLimit } from "~/lib/concurrency/run-with-limit";

const CHUNK_SIZE = 25;
const CONCORRENCIA = 3;

export interface ItemAderencia {
  id: string;
  resumo: string;
}

/**
 * Resultado discriminado: `ok: false` significa falha de infraestrutura
 * (todas as chamadas ao provedor falharam) e NÃO deve ser tratado pelo
 * chamador como "nenhuma aderência" — era exatamente essa confusão que jogava
 * todo candidato no banco de talentos quando o provedor estava mal
 * configurado (ADR-0011, ADR-0013).
 */
export type ClassificadorResultado =
  | { ok: true; scores: { id: string; score: number }[] }
  | { ok: false; motivo: "falha_provedor" };

const scoreItemSchema = z.object({
  id: z.string(),
  score: z.number().min(0).max(100),
});

// Raiz objeto (não array) para ser portável entre Gemini, OpenAI e Anthropic.
const resultadoClassificadorSchema = z.object({
  itens: z.array(scoreItemSchema),
});

const RESPONSE_JSON_SCHEMA = objetoComLista("itens", {
  type: "object",
  properties: {
    id: { type: "string" },
    score: { type: "number" },
  },
  required: ["id", "score"],
  additionalProperties: false,
});

export async function executarClassificadorAderencia(
  itemPrincipal: ItemAderencia,
  itensComparacao: ItemAderencia[],
  tipoPrincipal: string,
  tipoComparacao: string,
): Promise<ClassificadorResultado> {
  const config = await agenteConfigRepository.findBySlot(
    "classificador_aderencia",
  );
  if (!config?.ativo) {
    throw new Error(
      "Agente classificador_aderencia não está configurado/ativo.",
    );
  }

  const credencial = await llmCredencialRepository.findActiveByProvider(
    config.provider,
  );
  if (!credencial) {
    throw new Error(
      `Nenhuma credencial ativa para o provider "${config.provider}".`,
    );
  }

  const apiKey = decryptCredential(credencial.apiKeyCifrada);
  const idsValidos = new Set(itensComparacao.map((item) => item.id));

  const chunks: ItemAderencia[][] = [];
  for (let i = 0; i < itensComparacao.length; i += CHUNK_SIZE) {
    chunks.push(itensComparacao.slice(i, i + CHUNK_SIZE));
  }
  if (chunks.length === 0) return { ok: true, scores: [] };

  const resultadosPorChunk = await runWithLimit(
    chunks,
    CONCORRENCIA,
    async (chunk) => {
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

      const resposta = await gerarRespostaEstruturada({
        provider: config.provider,
        apiKey,
        model: config.model,
        systemPrompt,
        userPrompt,
        responseJsonSchema: RESPONSE_JSON_SCHEMA,
        responseZodSchema: resultadoClassificadorSchema,
      });
      return resposta.itens;
    },
  );

  const chunksComErro = resultadosPorChunk.filter(
    (r): r is { ok: false; error: unknown } => !r.ok,
  );
  for (const r of chunksComErro) {
    console.error(
      "[executarClassificadorAderencia] Falha em um chunk do classificador:",
      r.error,
    );
  }

  // Todos os chunks falharam -> falha de provedor, não ausência de aderência.
  if (chunksComErro.length === resultadosPorChunk.length) {
    return { ok: false, motivo: "falha_provedor" };
  }

  const scores = resultadosPorChunk
    .flatMap((r) => (r.ok ? r.value : []))
    .filter((item) => idsValidos.has(item.id));

  return { ok: true, scores };
}
