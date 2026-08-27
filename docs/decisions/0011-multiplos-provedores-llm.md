# 11. Suporte a Múltiplos Provedores de LLM (Roteiro Pós-MVP)

> **Nota de implementação (2026-08-25):** esta extensão, descrita abaixo
> como roadmap pós-MVP, foi antecipada e implementada — mesmo racional da
> captação por e-mail (ADR-0010): decisão de produto, não uma revisão desta
> ADR. A interface comum e os dois adaptadores descritos na seção Decisão
> foram construídos como planejado:
> [src/lib/agents/agent-client.ts](../../src/lib/agents/agent-client.ts)
> (dispatcher), [src/lib/agents/shared.ts](../../src/lib/agents/shared.ts)
> (contrato + retry + parse comuns) e
> [src/lib/agents/openai-client.ts](../../src/lib/agents/openai-client.ts)
> (OpenAI via Responses API, `fetch` nativo, sem dependência nova). O
> restante deste documento (Contexto, Alternativas) permanece como registro
> histórico da decisão original.

> **Nota de implementação (2026-08-27) — endurecimento multi-provedor e Claude:**
> a troca de provedor pela tela de admin não era de fato operável. Ajustes:
>
> 1. **Contrato formalizado.** `LlmAdapter` (em
>    [shared.ts](../../src/lib/agents/shared.ts)) é o contrato único; o
>    dispatcher virou um registry `provider -> LlmAdapter` em
>    [agent-client.ts](../../src/lib/agents/agent-client.ts).
> 2. **Invariante de schema de raiz objeto.** Saída estruturada não é portável:
>    OpenAI (strict) e Anthropic (tool use) recusam schema com raiz
>    `type: "array"` — só o Gemini aceitava, e por isso o `classificador_aderencia`
>    quebrava 100% ao ser apontado para OpenAI (HTTP 400 em toda chamada,
>    engolido silenciosamente, jogando todo candidato no banco de talentos).
>    [schema-dialect.ts](../../src/lib/agents/schema-dialect.ts) traz
>    `objetoComLista()` (o classificador agora devolve `{ itens: [...] }`) e
>    `assertRaizObjeto()`, chamado pelos adapters OpenAI/Anthropic para falhar
>    rápido com mensagem acionável.
> 3. **Semântica de erro.** `executarClassificadorAderencia` devolve um
>    resultado discriminado (`{ ok: false, motivo: "falha_provedor" }` quando
>    todas as chamadas falham). A orquestração (ADR-0013) só manda ao banco de
>    talentos quando o classificador respondeu e nenhum score passou do
>    threshold — falha de infra mantém o candidato ativo para reprocessamento.
> 4. **Terceiro adapter: Claude.**
>    [anthropic-client.ts](../../src/lib/agents/anthropic-client.ts) — Messages
>    API via `fetch` nativo (sem dependência nova), saída estruturada por tool
>    forçada (`tool_choice`), PDF/imagem como blocos `document`/`image`,
>    detecção de quota (429/529, `rate_limit_error`/`overloaded_error`).
> 5. **Parâmetros por slot.** `agente_config.params` (jsonb, já existia e
>    estava sem uso) passa a carregar `temperature` / `maxOutputTokens` /
>    `topP`, editáveis na tela do agente e repassados a todos os adapters.
> 6. **Validação de config.** `agenteConfigUpdateSchema` valida
>    `provider ∈ catálogo` e `model ∈ provider`; `updateAgenteConfig` recusa
>    ativar um slot sem credencial ativa para o provedor. A extração só
>    oferece provedores com capacidade multimodal (`ProviderCapabilities`).

## Status

Aceita

* **Relacionado a:** [ADR-0007: Encerramento da Integração via n8n e Adoção de Motor de Agentes Nativo](./0007-encerramento-integracao-n8n.md)

## Contexto

O motor de agentes nativo (ADR-0007) hoje suporta apenas Gemini via Google AI
Studio. A captação de currículo por e-mail deixou de ser extensão pós-MVP e
foi antecipada para dentro do MVP atual (ver
[ADR-0010](./0010-captacao-curriculo-via-email.md)). Esta continua sendo
pós-MVP — a primeira das duas extensões restantes no roadmap priorizado pelo
produto (ordem: múltiplos provedores de LLM → autenticação).

Inspeção do código mostra um acoplamento maior do que a UI sugere:

- [src/lib/agents/gemini-client.ts](../../src/lib/agents/gemini-client.ts) —
  `gerarRespostaEstruturada()` é escrita diretamente contra o SDK
  `@google/genai` e contra `responseJsonSchema`, o mecanismo de saída
  estruturada específico do Gemini.
- Os três agentes
  ([extracao-curriculo.ts](../../src/server/agents/extracao-curriculo.ts),
  [classificador-aderencia.ts](../../src/server/agents/classificador-aderencia.ts),
  [avaliador-triagem.ts](../../src/server/agents/avaliador-triagem.ts)) têm
  cada um uma constante `AGENT_PROVIDER = "google_ai_studio"` fixa no
  código — o provedor não é lido de configuração, é hardcoded.
- [provider-catalog.ts](../../src/lib/agents/provider-catalog.ts) já tem o
  formato de dados pronto para múltiplos provedores (`LLM_PROVIDERS: ProviderOption[]`),
  mas hoje só contém a entrada `google_ai_studio` — os demais nunca foram
  adicionados.
- `wgotalent_llm_credenciais` e `agenteConfigRepository` já são
  provider-aware no schema (`findActiveByProvider(provider)`), então a
  modelagem de dados não é o gargalo.

O gargalo real é que **saída estruturada não é portável entre provedores**:
OpenAI tem um mecanismo comparável (`response_format: { type: "json_schema" }`),
mas o Claude (Anthropic) não força um JSON Schema arbitrário do mesmo jeito —
o padrão usual é forçar uma única chamada de *tool use* com um
`input_schema`. Ou seja, trocar de provedor não é só trocar a API key.

## Decisão

Quando esta fase for iniciada, introduzir uma interface comum de cliente de
LLM em vez de estender `gemini-client.ts` com condicionais:

1. Definir um contrato (`LLMClient.gerarRespostaEstruturada(input): Promise<T>`)
   com a mesma assinatura de entrada/saída já usada hoje (prompt de sistema,
   prompt de usuário, arquivo opcional, schema JSON, schema Zod de validação
   em runtime).
2. `gemini-client.ts` vira a primeira implementação desse contrato (renomear
   ou envolver, sem reescrever a lógica de retry/backoff já testada).
3. Cada novo provedor (OpenAI, Anthropic) ganha seu próprio módulo adaptador
   em `src/lib/agents/`, resolvendo a saída estruturada com o mecanismo
   nativo do provedor, mas devolvendo o mesmo formato de resultado.
4. Os três agentes deixam de hardcodar `AGENT_PROVIDER` e passam a ler o
   provedor da configuração do slot (`agenteConfigRepository`), despachando
   para o cliente correto por um mapa `provider -> LLMClient`.
5. `provider-catalog.ts` só ganha uma entrada nova quando o adaptador
   correspondente existir de fato — mantendo a regra atual do comentário do
   arquivo ("os demais viram opção de UI só quando ganharem implementação
   real").

## Consequências

- **Positivas:** RH passa a poder escolher provedor/modelo por slot de
  agente (ex: extração em um provedor, avaliação em outro), sem lock-in a um
  único fornecedor de IA; a modelagem de credenciais e configuração já
  suporta isso hoje, então o esforço fica concentrado na camada de cliente.
- **Trade-offs:** é um refactor real, não uma extensão puramente aditiva —
  toca nos três arquivos de agente já testados e no cliente Gemini existente.
  Cada novo provedor exige entender e validar seu mecanismo específico de
  saída estruturada (risco de regressão sutil: um provedor pode devolver um
  JSON tecnicamente válido mas semanticamente diferente do que o Gemini
  devolvia para o mesmo prompt). Testes de contrato por provedor precisam ser
  criados, não só reaproveitados.
- Este é, das extensões pós-MVP priorizadas, a que mais interfere em código
  já validado em produção interna — mais até do que a captação por e-mail,
  que era puramente aditiva e por isso pôde ser antecipada para dentro do
  MVP (ADR-0010).

## Alternativas

- **Adicionar `if/else` por provedor dentro de cada agente**: descartado —
  triplica a lógica de despacho (uma cópia por agente) e dificulta testar o
  contrato de saída estruturada isoladamente do domínio de cada agente.
- **Adotar um SDK de abstração de terceiros (ex: Vercel AI SDK)**: já
  avaliado e descartado explicitamente no ADR-0007, que optou por
  `@google/genai` direto; reabrir essa escolha exigiria revisar o ADR-0007,
  não só este.
- **Implementar já dentro do MVP atual**: descartado por ora — diferente da
  captação por e-mail (ADR-0010, aditiva e sem tocar código já testado),
  esta extensão é um refactor real do motor de agentes já validado; entra
  no roadmap pós-MVP em vez de estender ainda mais o escopo do MVP.
