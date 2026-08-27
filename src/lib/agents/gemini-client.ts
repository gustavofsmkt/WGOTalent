import { GoogleGenAI } from "@google/genai";
import {
  AgenteChamadaError,
  AgenteQuotaExcedidaError,
  comRetry,
  parseRespostaEstruturada,
  type GerarRespostaEstruturadaInput,
  type LlmAdapter,
} from "./shared";

/** Detecta erro de limite de requisições (HTTP 429 / RESOURCE_EXHAUSTED) retornado pelo provedor. */
function isErroDeQuota(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  if (status === 429 || status === "429") return true;
  const message = (error as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    /RESOURCE_EXHAUSTED|"code":\s*429/.test(message)
  );
}

/**
 * As 3 etapas de agente (extração de currículo, classificador de aderência,
 * avaliador de triagem) chamam todas esta função — um único retry aqui cobre
 * as 3.
 */
export async function gerarRespostaEstruturada<T>(
  input: GerarRespostaEstruturadaInput<T>,
): Promise<T> {
  return comRetry(() => tentarGerarResposta(input));
}

export const geminiAdapter: LlmAdapter = { gerarRespostaEstruturada };

async function tentarGerarResposta<T>(
  input: GerarRespostaEstruturadaInput<T>,
): Promise<T> {
  const ai = new GoogleGenAI({ apiKey: input.apiKey });

  const parts: Array<Record<string, unknown>> = [];
  if (input.arquivo) {
    parts.push({
      inlineData: {
        mimeType: input.arquivo.mimeType,
        data: input.arquivo.data.toString("base64"),
      },
    });
  }
  parts.push({ text: input.userPrompt });

  let responseText: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model: input.model,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: input.systemPrompt,
        responseMimeType: "application/json",
        responseJsonSchema: input.responseJsonSchema,
        ...(input.params?.temperature !== undefined
          ? { temperature: input.params.temperature }
          : {}),
        ...(input.params?.topP !== undefined
          ? { topP: input.params.topP }
          : {}),
        ...(input.params?.maxOutputTokens !== undefined
          ? { maxOutputTokens: input.params.maxOutputTokens }
          : {}),
      },
    });
    responseText = response.text;
  } catch (error) {
    if (isErroDeQuota(error)) {
      console.error("[gemini-client] Erro de quota:", error);
      throw new AgenteQuotaExcedidaError(error);
    }
    console.error("[gemini-client] Falha ao chamar o Gemini:", error);
    throw new AgenteChamadaError(error);
  }

  if (!responseText) {
    throw new AgenteChamadaError(new Error("Resposta vazia do provedor."));
  }

  return parseRespostaEstruturada(responseText, input.responseZodSchema);
}
