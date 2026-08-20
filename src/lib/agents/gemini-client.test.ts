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
  gerarRespostaEstruturada,
} from "./gemini-client";

const schema = z.object({ score: z.number() });
const jsonSchema = {
  type: "object",
  properties: { score: { type: "number" } },
  required: ["score"],
};

describe("gerarRespostaEstruturada", () => {
  afterEach(() => {
    generateContentMock.mockReset();
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

  it("throws AgenteChamadaError when the provider call fails", async () => {
    generateContentMock.mockRejectedValueOnce(new Error("network down"));

    await expect(
      gerarRespostaEstruturada({
        apiKey: "fake-key",
        model: "gemini-3.5-flash",
        systemPrompt: "system",
        userPrompt: "user",
        responseJsonSchema: jsonSchema,
        responseZodSchema: schema,
      }),
    ).rejects.toBeInstanceOf(AgenteChamadaError);
  });

  it("throws AgenteQuotaExcedidaError when the provider returns a 429 status", async () => {
    generateContentMock.mockRejectedValueOnce(
      Object.assign(new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'), { status: 429 }),
    );

    await expect(
      gerarRespostaEstruturada({
        apiKey: "fake-key",
        model: "gemini-3.5-flash",
        systemPrompt: "system",
        userPrompt: "user",
        responseJsonSchema: jsonSchema,
        responseZodSchema: schema,
      }),
    ).rejects.toBeInstanceOf(AgenteQuotaExcedidaError);
  });

  it("throws AgenteQuotaExcedidaError when only the message mentions RESOURCE_EXHAUSTED", async () => {
    generateContentMock.mockRejectedValueOnce(
      new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'),
    );

    await expect(
      gerarRespostaEstruturada({
        apiKey: "fake-key",
        model: "gemini-3.5-flash",
        systemPrompt: "system",
        userPrompt: "user",
        responseJsonSchema: jsonSchema,
        responseZodSchema: schema,
      }),
    ).rejects.toBeInstanceOf(AgenteQuotaExcedidaError);
  });

  it("throws AgenteRespostaInvalidaError when the response fails schema validation", async () => {
    generateContentMock.mockResolvedValueOnce({ text: '{"score": "not-a-number"}' });

    await expect(
      gerarRespostaEstruturada({
        apiKey: "fake-key",
        model: "gemini-3.5-flash",
        systemPrompt: "system",
        userPrompt: "user",
        responseJsonSchema: jsonSchema,
        responseZodSchema: schema,
      }),
    ).rejects.toBeInstanceOf(AgenteRespostaInvalidaError);
  });
});
