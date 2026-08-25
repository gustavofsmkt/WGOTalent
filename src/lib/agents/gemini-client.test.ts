import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const generateContentMock = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
}));

import {
  AgenteChamadaError,
  AgenteQuotaExcedidaError,
  AgenteRespostaInvalidaError,
} from "./shared";
import { gerarRespostaEstruturada } from "./gemini-client";

const schema = z.object({ score: z.number() });
const jsonSchema = {
  type: "object",
  properties: { score: { type: "number" } },
  required: ["score"],
};

describe("gerarRespostaEstruturada", () => {
  afterEach(() => {
    generateContentMock.mockReset();
    vi.useRealTimers();
  });

  it("returns the parsed and validated response", async () => {
    generateContentMock.mockResolvedValueOnce({ text: '{"score": 80}' });

    const result = await gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gemini-3.5-flash",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });

    expect(result).toEqual({ score: 80 });
  });

  it("includes inlineData part when an arquivo is provided", async () => {
    generateContentMock.mockResolvedValueOnce({ text: '{"score": 50}' });

    await gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gemini-3.5-flash",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
      arquivo: { mimeType: "application/pdf", data: Buffer.from("pdf-bytes") },
    });

    const call = generateContentMock.mock.calls[0]![0];
    expect(call.contents[0].parts[0].inlineData.mimeType).toBe("application/pdf");
  });

  it("throws AgenteChamadaError when the provider call fails on every attempt", async () => {
    vi.useFakeTimers();
    generateContentMock.mockRejectedValue(new Error("network down"));

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gemini-3.5-flash",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    const expectation = expect(promise).rejects.toBeInstanceOf(AgenteChamadaError);
    await vi.runAllTimersAsync();
    await expectation;
    expect(generateContentMock).toHaveBeenCalledTimes(3);
  });

  it("throws AgenteQuotaExcedidaError when the provider returns a 429 status on every attempt", async () => {
    vi.useFakeTimers();
    generateContentMock.mockRejectedValue(
      Object.assign(new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'), { status: 429 }),
    );

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gemini-3.5-flash",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    const expectation = expect(promise).rejects.toBeInstanceOf(AgenteQuotaExcedidaError);
    await vi.runAllTimersAsync();
    await expectation;
    expect(generateContentMock).toHaveBeenCalledTimes(3);
  });

  it("throws AgenteQuotaExcedidaError when only the message mentions RESOURCE_EXHAUSTED", async () => {
    vi.useFakeTimers();
    generateContentMock.mockRejectedValue(
      new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'),
    );

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gemini-3.5-flash",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    const expectation = expect(promise).rejects.toBeInstanceOf(AgenteQuotaExcedidaError);
    await vi.runAllTimersAsync();
    await expectation;
  });

  it("throws AgenteRespostaInvalidaError when the response fails schema validation on every attempt", async () => {
    vi.useFakeTimers();
    generateContentMock.mockResolvedValue({ text: '{"score": "not-a-number"}' });

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gemini-3.5-flash",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    const expectation = expect(promise).rejects.toBeInstanceOf(AgenteRespostaInvalidaError);
    await vi.runAllTimersAsync();
    await expectation;
    expect(generateContentMock).toHaveBeenCalledTimes(3);
  });

  it("retries with exponential backoff and succeeds once the provider recovers", async () => {
    vi.useFakeTimers();
    generateContentMock
      .mockRejectedValueOnce(new Error("network blip"))
      .mockRejectedValueOnce(new Error("network blip again"))
      .mockResolvedValueOnce({ text: '{"score": 42}' });

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gemini-3.5-flash",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ score: 42 });
    expect(generateContentMock).toHaveBeenCalledTimes(3);
  });

  it("does not delay before the first attempt and waits longer between later retries", async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    generateContentMock
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce({ text: '{"score": 10}' });

    const promise = gerarRespostaEstruturada({
      apiKey: "fake-key",
      model: "gemini-3.5-flash",
      systemPrompt: "system",
      userPrompt: "user",
      responseJsonSchema: jsonSchema,
      responseZodSchema: schema,
    });
    await vi.runAllTimersAsync();
    await promise;

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
  });
});
