import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { geminiMock, openaiMock, anthropicMock } = vi.hoisted(() => ({
  geminiMock: vi.fn(),
  openaiMock: vi.fn(),
  anthropicMock: vi.fn(),
}));

vi.mock("./gemini-client", () => ({
  geminiAdapter: { gerarRespostaEstruturada: geminiMock },
}));
vi.mock("./openai-client", () => ({
  openaiAdapter: { gerarRespostaEstruturada: openaiMock },
}));
vi.mock("./anthropic-client", () => ({
  anthropicAdapter: { gerarRespostaEstruturada: anthropicMock },
}));

import {
  gerarRespostaEstruturada,
  providerSuportado,
  getLlmAdapter,
} from "./agent-client";

const schema = z.object({ score: z.number() });
const baseInput = {
  apiKey: "fake-key",
  model: "modelo",
  systemPrompt: "system",
  userPrompt: "user",
  responseJsonSchema: { type: "object" as const },
  responseZodSchema: schema,
};

describe("gerarRespostaEstruturada (dispatcher)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches to the gemini adapter for google_ai_studio", async () => {
    geminiMock.mockResolvedValueOnce({ score: 1 });

    const result = await gerarRespostaEstruturada({
      provider: "google_ai_studio",
      ...baseInput,
    });

    expect(result).toEqual({ score: 1 });
    expect(geminiMock).toHaveBeenCalledWith(baseInput);
    expect(openaiMock).not.toHaveBeenCalled();
    expect(anthropicMock).not.toHaveBeenCalled();
  });

  it("dispatches to the openai adapter for openai", async () => {
    openaiMock.mockResolvedValueOnce({ score: 2 });

    const result = await gerarRespostaEstruturada({
      provider: "openai",
      ...baseInput,
    });

    expect(result).toEqual({ score: 2 });
    expect(openaiMock).toHaveBeenCalledWith(baseInput);
    expect(geminiMock).not.toHaveBeenCalled();
  });

  it("dispatches to the anthropic adapter for anthropic", async () => {
    anthropicMock.mockResolvedValueOnce({ score: 3 });

    const result = await gerarRespostaEstruturada({
      provider: "anthropic",
      ...baseInput,
    });

    expect(result).toEqual({ score: 3 });
    expect(anthropicMock).toHaveBeenCalledWith(baseInput);
    expect(geminiMock).not.toHaveBeenCalled();
    expect(openaiMock).not.toHaveBeenCalled();
  });

  it("throws for an unsupported provider", async () => {
    await expect(
      gerarRespostaEstruturada({ provider: "cohere", ...baseInput }),
    ).rejects.toThrow(/cohere/);
    expect(geminiMock).not.toHaveBeenCalled();
    expect(openaiMock).not.toHaveBeenCalled();
    expect(anthropicMock).not.toHaveBeenCalled();
  });

  it("providerSuportado reflects the registry", () => {
    expect(providerSuportado("google_ai_studio")).toBe(true);
    expect(providerSuportado("openai")).toBe(true);
    expect(providerSuportado("anthropic")).toBe(true);
    expect(providerSuportado("cohere")).toBe(false);
  });

  it("getLlmAdapter throws for an unknown provider", () => {
    expect(() => getLlmAdapter("mistral")).toThrow(/mistral/);
  });
});
