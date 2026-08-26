import { gerarRespostaEstruturada as gerarRespostaGemini } from "./gemini-client";
import { gerarRespostaEstruturada as gerarRespostaOpenAI } from "./openai-client";
import type { GerarRespostaEstruturadaInput } from "./shared";

export interface GerarRespostaEstruturadaComProviderInput<
  T,
> extends GerarRespostaEstruturadaInput<T> {
  provider: string;
}

/**
 * Ponto único usado pelos 3 agentes (extração, classificador, avaliador) —
 * escolhe o client do provedor configurado em `agente_config.provider`,
 * mantendo os agentes agnósticos de qual LLM está por trás.
 */
export async function gerarRespostaEstruturada<T>(
  input: GerarRespostaEstruturadaComProviderInput<T>,
): Promise<T> {
  const { provider, ...rest } = input;
  switch (provider) {
    case "google_ai_studio":
      return gerarRespostaGemini(rest);
    case "openai":
      return gerarRespostaOpenAI(rest);
    default:
      throw new Error(`Provider de LLM "${provider}" não suportado.`);
  }
}
