import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  AgenteChamadaError,
  AgenteQuotaExcedidaError,
  AgenteRespostaInvalidaError,
} from "./shared";
import { gerarRespostaEstruturada } from "./anthropic-client";

const schema = z.object({ score: z.number() });
const jsonSchema = {
  type: "object",
  properties: { score: { type: "number" } },
  required: ["score"],
  additionalProperties: false,
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

function respostaComToolUse(input: unknown): Response {
  return jsonResponse(200, {
    content: [
      { type: "text", text: "ok" },
      { type: "tool_use", name: "resposta_estruturada", input },
    ],
  });
}

const baseInput = {
  apiKey: "fake-key",
  model: "claude-sonnet-5",
  systemPrompt: "system",
  userPrompt: "user",
  responseJsonSchema: jsonSchema,
  responseZodSchema: schema,
};

describe("gerarRespostaEstruturada (anthropic)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("forces a single tool and reads its input as the structured response", async () => {
    fetchMock.mockResolvedValueOnce(respostaComToolUse({ score: 88 }));

    const result = await gerarRespostaEstruturada(baseInput);

    expect(result).toEqual({ score: 88 });
    const [url, requestInit] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(requestInit.headers["x-api-key"]).toBe("fake-key");
    expect(requestInit.headers["anthropic-version"]).toBe("2023-06-01");
    const body = JSON.parse(requestInit.body as string);
    expect(body.tools[0].name).toBe("resposta_estruturada");
    expect(body.tools[0].input_schema).toEqual(jsonSchema);
    expect(body.tool_choice).toEqual({
      type: "tool",
      name: "resposta_estruturada",
    });
    expect(body.max_tokens).toBeGreaterThan(0);
  });

  it("sends a PDF as a document content block", async () => {
    fetchMock.mockResolvedValueOnce(respostaComToolUse({ score: 1 }));

    await gerarRespostaEstruturada({
      ...baseInput,
      arquivo: { mimeType: "application/pdf", data: Buffer.from("pdf-bytes") },
    });

    const [, requestInit] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(requestInit.body as string);
    const bloco = body.messages[0].content[0];
    expect(bloco.type).toBe("document");
    expect(bloco.source.media_type).toBe("application/pdf");
    expect(bloco.source.type).toBe("base64");
  });

  it("sends an image as an image content block", async () => {
    fetchMock.mockResolvedValueOnce(respostaComToolUse({ score: 1 }));

    await gerarRespostaEstruturada({
      ...baseInput,
      arquivo: { mimeType: "image/png", data: Buffer.from("png-bytes") },
    });

    const [, requestInit] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(requestInit.body as string);
    const bloco = body.messages[0].content[0];
    expect(bloco.type).toBe("image");
    expect(bloco.source.media_type).toBe("image/png");
  });

  it("throws before calling fetch when the schema root is not an object", async () => {
    await expect(
      gerarRespostaEstruturada({
        ...baseInput,
        responseJsonSchema: { type: "array", items: { type: "string" } },
      }),
    ).rejects.toThrow(/objetoComLista/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws AgenteQuotaExcedidaError on HTTP 429 for every attempt", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () =>
      jsonResponse(429, { error: { type: "rate_limit_error" } }),
    );

    const promise = gerarRespostaEstruturada(baseInput);
    const expectation = expect(promise).rejects.toBeInstanceOf(
      AgenteQuotaExcedidaError,
    );
    await vi.runAllTimersAsync();
    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("treats HTTP 529 overloaded as a quota error", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () =>
      jsonResponse(529, { error: { type: "overloaded_error" } }),
    );

    const promise = gerarRespostaEstruturada(baseInput);
    const expectation = expect(promise).rejects.toBeInstanceOf(
      AgenteQuotaExcedidaError,
    );
    await vi.runAllTimersAsync();
    await expectation;
  });

  it("throws AgenteChamadaError for other non-2xx statuses", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () =>
      jsonResponse(400, { error: { type: "invalid_request_error" } }),
    );

    const promise = gerarRespostaEstruturada(baseInput);
    const expectation =
      expect(promise).rejects.toBeInstanceOf(AgenteChamadaError);
    await vi.runAllTimersAsync();
    await expectation;
  });

  it("throws AgenteChamadaError when no tool_use block is present", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () =>
      jsonResponse(200, { content: [{ type: "text", text: "sem tool" }] }),
    );

    const promise = gerarRespostaEstruturada(baseInput);
    const expectation =
      expect(promise).rejects.toBeInstanceOf(AgenteChamadaError);
    await vi.runAllTimersAsync();
    await expectation;
  });

  it("throws AgenteRespostaInvalidaError when tool input fails schema validation", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () =>
      respostaComToolUse({ score: "not-a-number" }),
    );

    const promise = gerarRespostaEstruturada(baseInput);
    const expectation = expect(promise).rejects.toBeInstanceOf(
      AgenteRespostaInvalidaError,
    );
    await vi.runAllTimersAsync();
    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
