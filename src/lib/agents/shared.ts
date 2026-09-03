import type { z } from "zod";

export interface AgentArquivo {
  mimeType: string;
  data: Buffer;
}

export interface GerarRespostaEstruturadaInput<T> {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  /** JSON Schema em modo strict (todo campo em `required`, `additionalProperties: false`). Raiz DEVE ser `type: "object"` — ver schema-dialect.ts. */
  responseJsonSchema: Record<string, unknown>;
  /** Schema Zod usado para validar em runtime o JSON já parseado, antes de devolver ao chamador. */
  responseZodSchema: z.ZodType<T, z.ZodTypeDef, unknown>;
  arquivo?: AgentArquivo;
}

/**
 * Contrato único que todo adapter de provedor implementa (ADR-0011). O
 * dispatcher em agent-client.ts escolhe o adapter pelo `provider` da config
 * do slot; os agentes permanecem agnósticos de qual LLM está por trás.
 */
export interface LlmAdapter {
  gerarRespostaEstruturada<T>(
    input: GerarRespostaEstruturadaInput<T>,
  ): Promise<T>;
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
    super(
      "Limite de requisições do provedor de IA atingido. Tente novamente em instantes.",
    );
    this.cause = cause;
  }
}

const MAX_TENTATIVAS = 3;
const BACKOFF_BASE_MS = 500;

function calcularDelayBackoff(tentativa: number): number {
  return BACKOFF_BASE_MS * 2 ** (tentativa - 1);
}

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry com backoff exponencial (500ms, 1s), compartilhado por todos os
 * clients de provedor — a falha mais comum é rate limit (429), reaplicado
 * também a resposta malformada, já que a geração é não-determinística e uma
 * nova tentativa pode vir válida.
 */
export async function comRetry<T>(tentar: () => Promise<T>): Promise<T> {
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      return await tentar();
    } catch (error) {
      ultimoErro = error;
      if (tentativa < MAX_TENTATIVAS) {
        await aguardar(calcularDelayBackoff(tentativa));
      }
    }
  }

  throw ultimoErro;
}

/** Validação Zod de um valor já desserializado (ex: `tool_use.input` da Anthropic), com o log padrão dos clients. */
export function validarRespostaEstruturada<T>(
  parsed: unknown,
  responseZodSchema: z.ZodType<T, z.ZodTypeDef, unknown>,
): T {
  const result = responseZodSchema.safeParse(parsed);
  if (!result.success) {
    console.error(
      "[validarRespostaEstruturada] Resposta do agente não corresponde ao schema esperado:",
      JSON.stringify(result.error.issues, null, 2),
      "\nResposta recebida:",
      JSON.stringify(parsed, null, 2),
    );
    throw new AgenteRespostaInvalidaError(result.error);
  }

  return result.data;
}

/** `JSON.parse` + validação Zod do texto de resposta, com o log padrão usado pelos clients de provedor. */
export function parseRespostaEstruturada<T>(
  responseText: string,
  responseZodSchema: z.ZodType<T, z.ZodTypeDef, unknown>,
): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch (error) {
    console.error(
      "[parseRespostaEstruturada] JSON inválido na resposta do agente:",
      responseText,
    );
    throw new AgenteRespostaInvalidaError(error);
  }

  return validarRespostaEstruturada(parsed, responseZodSchema);
}
