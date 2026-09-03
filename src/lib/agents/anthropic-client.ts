import {
  AgenteChamadaError,
  AgenteQuotaExcedidaError,
  comRetry,
  validarRespostaEstruturada,
  type GerarRespostaEstruturadaInput,
  type LlmAdapter,
} from "./shared";
import { assertRaizObjeto } from "./schema-dialect";

/**
 * Messages API (`/v1/messages`) via `fetch` nativo — sem dependência nova,
 * mesmo padrão do openai-client.ts. Claude não força um JSON Schema arbitrário
 * como Gemini/OpenAI: o mecanismo portável é declarar uma única *tool* e
 * obrigar seu uso (`tool_choice`), lendo o objeto já estruturado de
 * `content[].input` do bloco `tool_use` (ADR-0011).
 */
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const TOOL_NAME = "resposta_estruturada";
const DEFAULT_MAX_TOKENS = 8192;

export async function gerarRespostaEstruturada<T>(
  input: GerarRespostaEstruturadaInput<T>,
): Promise<T> {
  return comRetry(() => tentarGerarResposta(input));
}

export const anthropicAdapter: LlmAdapter = { gerarRespostaEstruturada };

function montarBlocosUsuario(
  input: GerarRespostaEstruturadaInput<unknown>,
): unknown[] {
  const blocos: unknown[] = [];

  if (input.arquivo) {
    const base64 = input.arquivo.data.toString("base64");
    blocos.push(
      input.arquivo.mimeType === "application/pdf"
        ? {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          }
        : {
            type: "image",
            source: {
              type: "base64",
              media_type: input.arquivo.mimeType,
              data: base64,
            },
          },
    );
  }

  blocos.push({ type: "text", text: input.userPrompt });
  return blocos;
}

/** Localiza o `input` do bloco `tool_use` da ferramenta forçada na resposta. */
function extrairToolInput(body: unknown): unknown {
  if (!body || typeof body !== "object") return undefined;
  const content = (body as { content?: unknown }).content;
  if (!Array.isArray(content)) return undefined;

  for (const part of content) {
    if (
      part &&
      typeof part === "object" &&
      (part as { type?: unknown }).type === "tool_use" &&
      (part as { name?: unknown }).name === TOOL_NAME
    ) {
      return (part as { input?: unknown }).input;
    }
  }

  return undefined;
}

function isErroDeQuota(status: number, body: unknown): boolean {
  if (status === 429 || status === 529) return true;
  const tipo = (body as { error?: { type?: unknown } } | null)?.error?.type;
  return tipo === "rate_limit_error" || tipo === "overloaded_error";
}

async function tentarGerarResposta<T>(
  input: GerarRespostaEstruturadaInput<T>,
): Promise<T> {
  assertRaizObjeto(input.responseJsonSchema, "anthropic-client");

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": input.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: DEFAULT_MAX_TOKENS,
        system: input.systemPrompt,
        messages: [
          { role: "user", content: montarBlocosUsuario(input) },
        ],
        tools: [
          {
            name: TOOL_NAME,
            description:
              "Registra a resposta estruturada exigida pela plataforma. Preencha todos os campos.",
            input_schema: input.responseJsonSchema,
          },
        ],
        tool_choice: { type: "tool", name: TOOL_NAME },
      }),
    });
  } catch (error) {
    console.error(
      "[anthropic-client] Falha de rede ao chamar a Messages API:",
      error,
    );
    throw new AgenteChamadaError(error);
  }

  if (!response.ok) {
    const corpoTexto = await response.text();
    let corpoJson: unknown;
    try {
      corpoJson = JSON.parse(corpoTexto);
    } catch {
      corpoJson = undefined;
    }

    if (isErroDeQuota(response.status, corpoJson)) {
      console.error("[anthropic-client] Limite de requisições:", corpoTexto);
      throw new AgenteQuotaExcedidaError(new Error(corpoTexto));
    }

    console.error(`[anthropic-client] HTTP ${response.status}:`, corpoTexto);
    throw new AgenteChamadaError(
      new Error(`HTTP ${response.status}: ${corpoTexto}`),
    );
  }

  const toolInput = extrairToolInput(await response.json());
  if (toolInput === undefined) {
    throw new AgenteChamadaError(
      new Error("Resposta sem bloco tool_use da ferramenta esperada."),
    );
  }

  return validarRespostaEstruturada(toolInput, input.responseZodSchema);
}
