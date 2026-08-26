import {
  AgenteChamadaError,
  AgenteQuotaExcedidaError,
  comRetry,
  parseRespostaEstruturada,
  type GerarRespostaEstruturadaInput,
} from "./shared";

/**
 * Responses API (`/v1/responses`), não Chat Completions — é o endpoint atual
 * da OpenAI com suporte documentado a entrada de arquivo (PDF) nativo; o
 * Chat Completions não documenta esse caso (só imagem). Verificado direto na
 * doc oficial em 2026-08-24, não de memória — essa API muda com frequência.
 */
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export async function gerarRespostaEstruturada<T>(
  input: GerarRespostaEstruturadaInput<T>,
): Promise<T> {
  return comRetry(() => tentarGerarResposta(input));
}

function montarConteudoUsuario(
  input: GerarRespostaEstruturadaInput<unknown>,
): unknown[] {
  const partes: unknown[] = [{ type: "input_text", text: input.userPrompt }];

  if (input.arquivo) {
    const dataUri = `data:${input.arquivo.mimeType};base64,${input.arquivo.data.toString("base64")}`;
    partes.push(
      input.arquivo.mimeType === "application/pdf"
        ? { type: "input_file", filename: "curriculo.pdf", file_data: dataUri }
        : { type: "input_image", image_url: dataUri },
    );
  }

  return partes;
}

/** Extrai o texto de saída de `response.output[].content[].text` (tipo `output_text`). */
function extrairTextoDaResposta(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const output = (body as { output?: unknown }).output;
  if (!Array.isArray(output)) return undefined;

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        (part as { type?: unknown }).type === "output_text"
      ) {
        const text = (part as { text?: unknown }).text;
        if (typeof text === "string") return text;
      }
    }
  }

  return undefined;
}

async function tentarGerarResposta<T>(
  input: GerarRespostaEstruturadaInput<T>,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        input: [
          { type: "message", role: "system", content: input.systemPrompt },
          {
            type: "message",
            role: "user",
            content: montarConteudoUsuario(input),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "resposta_estruturada",
            schema: input.responseJsonSchema,
            strict: true,
          },
        },
      }),
    });
  } catch (error) {
    console.error(
      "[openai-client] Falha de rede ao chamar a Responses API:",
      error,
    );
    throw new AgenteChamadaError(error);
  }

  if (response.status === 429) {
    const corpo = await response.text();
    console.error("[openai-client] HTTP 429 (rate limit):", corpo);
    throw new AgenteQuotaExcedidaError(new Error(corpo));
  }
  if (!response.ok) {
    const corpo = await response.text();
    console.error(`[openai-client] HTTP ${response.status}:`, corpo);
    throw new AgenteChamadaError(
      new Error(`HTTP ${response.status}: ${corpo}`),
    );
  }

  const responseText = extrairTextoDaResposta(await response.json());
  if (!responseText) {
    throw new AgenteChamadaError(new Error("Resposta vazia do provedor."));
  }

  return parseRespostaEstruturada(responseText, input.responseZodSchema);
}
