import { geminiAdapter } from "./gemini-client";
import { openaiAdapter } from "./openai-client";
import { anthropicAdapter } from "./anthropic-client";
import type { GerarRespostaEstruturadaInput, LlmAdapter } from "./shared";

export interface GerarRespostaEstruturadaComProviderInput<
  T,
> extends GerarRespostaEstruturadaInput<T> {
  provider: string;
}

/**
 * Registry provider -> adapter (ADR-0011). Um provedor só entra aqui quando
 * o adapter correspondente existe de fato; o provider-catalog.ts espelha esta
 * lista para a UI.
 */
const ADAPTERS: Record<string, LlmAdapter> = {
  google_ai_studio: geminiAdapter,
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
};

export function providerSuportado(provider: string): boolean {
  return provider in ADAPTERS;
}

export function getLlmAdapter(provider: string): LlmAdapter {
  const adapter = ADAPTERS[provider];
  if (!adapter) {
    throw new Error(`Provider de LLM "${provider}" não suportado.`);
  }
  return adapter;
}

/**
 * Ponto único usado pelos 3 agentes (extração, classificador, avaliador) —
 * despacha para o client do provedor configurado em `agente_config.provider`,
 * mantendo os agentes agnósticos de qual LLM está por trás.
 */
export async function gerarRespostaEstruturada<T>(
  input: GerarRespostaEstruturadaComProviderInput<T>,
): Promise<T> {
  const { provider, ...rest } = input;
  return getLlmAdapter(provider).gerarRespostaEstruturada(rest);
}
