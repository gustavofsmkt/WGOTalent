/**
 * Catálogo estático de provedores/modelos de LLM suportados pelo motor de
 * agentes. "google_ai_studio" e "openai" têm backend implementado
 * (gemini-client.ts / openai-client.ts, escolhidos via agent-client.ts) —
 * outros provedores viram opção de UI só quando ganharem implementação real.
 */
export interface ModelOption {
  value: string;
  label: string;
}

export interface ProviderOption {
  value: string;
  label: string;
  models: ModelOption[];
}

export const LLM_PROVIDERS: ProviderOption[] = [
  {
    value: "google_ai_studio",
    label: "Gemini (Google AI Studio)",
    models: [
      { value: "gemini-3.7-flash", label: "Gemini 3.7 Flash" },
      { value: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
      { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
      { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
      { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
      { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
    ],
  },
  {
    value: "openai",
    label: "OpenAI",
    models: [
      { value: "gpt-5.6-sol", label: "GPT-5.6 Sol" },
      { value: "gpt-5.6-terra", label: "GPT-5.6 Terra" },
      { value: "gpt-5.6-luna", label: "GPT-5.6 Luna" },
    ],
  },
];

export function getProviderLabel(provider: string): string {
  return LLM_PROVIDERS.find((p) => p.value === provider)?.label ?? provider;
}

export function getModelsForProvider(provider: string): ModelOption[] {
  return LLM_PROVIDERS.find((p) => p.value === provider)?.models ?? [];
}
