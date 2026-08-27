/**
 * Catálogo estático de provedores/modelos de LLM suportados pelo motor de
 * agentes. "google_ai_studio", "openai" e "anthropic" têm backend implementado
 * (gemini-client.ts / openai-client.ts / anthropic-client.ts, escolhidos via
 * agent-client.ts) — outros provedores viram opção de UI só quando ganharem
 * implementação real. Este arquivo é dado puro: pode ser importado tanto por
 * código de servidor quanto por componentes client.
 */
export interface ModelOption {
  value: string;
  label: string;
}

/** Capacidades relevantes para a UI decidir quais provedores oferecer por slot (ex: extração precisa de multimodal). */
export interface ProviderCapabilities {
  multimodalPdf: boolean;
  multimodalImage: boolean;
}

export interface ProviderOption {
  value: string;
  label: string;
  models: ModelOption[];
  capabilities: ProviderCapabilities;
}

export const LLM_PROVIDERS: ProviderOption[] = [
  {
    value: "google_ai_studio",
    label: "Gemini (Google AI Studio)",
    capabilities: { multimodalPdf: true, multimodalImage: true },
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
    capabilities: { multimodalPdf: true, multimodalImage: true },
    models: [
      { value: "gpt-5.6-sol", label: "GPT-5.6 Sol" },
      { value: "gpt-5.6-terra", label: "GPT-5.6 Terra" },
      { value: "gpt-5.6-luna", label: "GPT-5.6 Luna" },
    ],
  },
  {
    value: "anthropic",
    label: "Claude (Anthropic)",
    capabilities: { multimodalPdf: true, multimodalImage: true },
    models: [
      { value: "claude-opus-5", label: "Claude Opus 5" },
      { value: "claude-sonnet-5", label: "Claude Sonnet 5" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
  },
];

export function getProviderLabel(provider: string): string {
  return LLM_PROVIDERS.find((p) => p.value === provider)?.label ?? provider;
}

export function getModelsForProvider(provider: string): ModelOption[] {
  return LLM_PROVIDERS.find((p) => p.value === provider)?.models ?? [];
}

export function getProviderCapabilities(provider: string): ProviderCapabilities {
  return (
    LLM_PROVIDERS.find((p) => p.value === provider)?.capabilities ?? {
      multimodalPdf: false,
      multimodalImage: false,
    }
  );
}

export function isProviderConhecido(provider: string): boolean {
  return LLM_PROVIDERS.some((p) => p.value === provider);
}

export function isModeloValido(provider: string, model: string): boolean {
  return getModelsForProvider(provider).some((m) => m.value === model);
}
