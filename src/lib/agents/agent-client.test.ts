import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { geminiMock, openaiMock } = vi.hoisted(() => ({
  geminiMock: vi.fn(),
  openaiMock: vi.fn(),
}));

vi.mock("./gemini-client", () => ({ gerarRespostaEstruturada: geminiMock }));
vi.mock("./openai-client", () => ({ gerarRespostaEstruturada: openaiMock }));

import { gerarRespostaEstruturada } from "./agent-client";

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

  it("dispatches to the gemini client for google_ai_studio", async () => {
    geminiMock.mockResolvedValueOnce({ score: 1 });

    const result = await gerarRespostaEstruturada({
      provider: "google_ai_studio",
      ...baseInput,
    });

    expect(result).toEqual({ score: 1 });
    expect(geminiMock).toHaveBeenCalledWith(baseInput);
    expect(openaiMock).not.toHaveBeenCalled();
  });

  it("dispatches to the openai client for openai", async () => {
    openaiMock.mockResolvedValueOnce({ score: 2 });

    const result = await gerarRespostaEstruturada({
      provider: "openai",
      ...baseInput,
    });

    expect(result).toEqual({ score: 2 });
    expect(openaiMock).toHaveBeenCalledWith(baseInput);
    expect(geminiMock).not.toHaveBeenCalled();
  });

  it("throws for an unsupported provider", async () => {
    await expect(
      gerarRespostaEstruturada({ provider: "anthropic", ...baseInput }),
    ).rejects.toThrow(/anthropic/);
    expect(geminiMock).not.toHaveBeenCalled();
    expect(openaiMock).not.toHaveBeenCalled();
  });
});
