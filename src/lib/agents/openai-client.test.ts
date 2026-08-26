import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  AgenteChamadaError,
  AgenteQuotaExcedidaError,
  AgenteRespostaInvalidaError,
} from "./shared";
import { gerarRespostaEstruturada } from "./openai-client";

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

function respostaComTexto(text: string): Response {
  return jsonResponse(200, {
    output: [{ type: "message", content: [{ type: "output_text", text }] }],
  });
}

describe("gerarRespostaEstruturada (openai)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns the parsed and validated response", async () => {
    fetchMock.mockResolvedValueOnce(respostaComTexto('{"score": 80}'));

    const result = await gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gpt-5.6-terra",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });

    expect(result).toEqual({ score: 80 });
    const [url, requestInit] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(requestInit.headers.Authorization).toBe("Bearer fake-key");
    const body = JSON.parse(requestInit.body as string);
    expect(body.text.format.schema).toEqual(jsonSchema);
    expect(body.text.format.strict).toBe(true);
  });

  it("sends the file as input_file when arquivo is a PDF", async () => {
    fetchMock.mockResolvedValueOnce(respostaComTexto('{"score": 50}'));

    await gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gpt-5.6-terra",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
      arquivo: { mimeType: "application/pdf", data: Buffer.from("pdf-bytes") },
    });

    const [, requestInit] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(requestInit.body as string);
    const userContent = body.input[1].content;
    expect(userContent[1].type).toBe("input_file");
    expect(userContent[1].file_data).toContain("data:application/pdf;base64,");
  });

  it("sends the file as input_image when arquivo is an image", async () => {
    fetchMock.mockResolvedValueOnce(respostaComTexto('{"score": 50}'));

    await gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gpt-5.6-terra",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
      arquivo: { mimeType: "image/png", data: Buffer.from("png-bytes") },
    });

    const [, requestInit] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(requestInit.body as string);
    const userContent = body.input[1].content;
    expect(userContent[1].type).toBe("input_image");
    expect(userContent[1].image_url).toContain("data:image/png;base64,");
  });

  it("throws AgenteChamadaError when the fetch call fails on every attempt", async () => {
    vi.useFakeTimers();
    fetchMock.mockRejectedValue(new Error("network down"));

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gpt-5.6-terra",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    const expectation =
      expect(promise).rejects.toBeInstanceOf(AgenteChamadaError);
    await vi.runAllTimersAsync();
    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws AgenteQuotaExcedidaError when the provider returns HTTP 429 on every attempt", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () =>
      jsonResponse(429, { error: { message: "rate limit" } }),
    );

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gpt-5.6-terra",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    const expectation = expect(promise).rejects.toBeInstanceOf(
      AgenteQuotaExcedidaError,
    );
    await vi.runAllTimersAsync();
    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws AgenteChamadaError for other non-2xx HTTP statuses", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () =>
      jsonResponse(500, { error: { message: "server error" } }),
    );

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gpt-5.6-terra",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    const expectation =
      expect(promise).rejects.toBeInstanceOf(AgenteChamadaError);
    await vi.runAllTimersAsync();
    await expectation;
  });

  it("throws AgenteRespostaInvalidaError when the response fails schema validation on every attempt", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () =>
      respostaComTexto('{"score": "not-a-number"}'),
    );

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gpt-5.6-terra",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    const expectation = expect(promise).rejects.toBeInstanceOf(
      AgenteRespostaInvalidaError,
    );
    await vi.runAllTimersAsync();
    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries with exponential backoff and succeeds once the provider recovers", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockRejectedValueOnce(new Error("network blip"))
      .mockRejectedValueOnce(new Error("network blip again"))
      .mockResolvedValueOnce(respostaComTexto('{"score": 42}'));

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gpt-5.6-terra",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ score: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
