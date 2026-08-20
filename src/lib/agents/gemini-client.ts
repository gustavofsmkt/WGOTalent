import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";

export interface GeminiArquivo {
  mimeType: string;
  data: Buffer;
}

export interface GerarRespostaEstruturadaInput<T> {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  /** JSON Schema (subset suportado pelo Gemini) descrevendo o formato esperado da resposta. */
  responseJsonSchema: Record<string, unknown>;
  /** Schema Zod usado para validar em runtime o JSON já parseado, antes de devolver ao chamador. */
  responseZodSchema: z.ZodType<T, z.ZodTypeDef, unknown>;
  arquivo?: GeminiArquivo;
}

export class AgenteRespostaInvalidaError extends Error {
  constructor(cause: unknown) {
    super("Resposta do agente não corresponde ao schema esperado.");
    this.cause = cause;
  }
}

export class AgenteChamadaError extends Error {
  constructor(cause: unknown) {
    super("Falha ao chamar o provedor de LLM.");
    this.cause = cause;
  }
}

export class AgenteQuotaExcedidaError extends Error {
  constructor(cause: unknown) {
    super("Limite de requisições do provedor de IA atingido. Tente novamente em instantes.");
    this.cause = cause;
  }
}

/** Detecta erro de limite de requisições (HTTP 429 / RESOURCE_EXHAUSTED) retornado pelo provedor. */
function isErroDeQuota(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  if (status === 429 || status === "429") return true;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && /RESOURCE_EXHAUSTED|"code":\s*429/.test(message);
}

export async function gerarRespostaEstruturada<T>(
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
      },
    });
    responseText = response.text;
  } catch (error) {
    if (isErroDeQuota(error)) {
      throw new AgenteQuotaExcedidaError(error);
    }
    throw new AgenteChamadaError(error);
  }

  if (!responseText) {
    throw new AgenteChamadaError(new Error("Resposta vazia do provedor."));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch (error) {
    console.error("[gerarRespostaEstruturada] JSON inválido na resposta do agente:", responseText);
    throw new AgenteRespostaInvalidaError(error);
  }

  const result = input.responseZodSchema.safeParse(parsed);
  if (!result.success) {
    console.error(
      "[gerarRespostaEstruturada] Resposta do agente não corresponde ao schema esperado:",
      JSON.stringify(result.error.issues, null, 2),
      "\nResposta recebida:",
      JSON.stringify(parsed, null, 2),
    );
    throw new AgenteRespostaInvalidaError(result.error);
  }

  return result.data;
}
