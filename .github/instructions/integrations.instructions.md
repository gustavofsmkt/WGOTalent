---
description: "Diretrizes para o motor de agentes nativo (IA) e armazenamento (storage) de arquivos."
applyTo: 
  - "src/actions/**"
  - "src/app/api/**"
  - "src/lib/storage/**"
  - "src/lib/agents/**"
  - "src/lib/email/**"
  - "src/server/agents/**"
  - "src/server/email/**"
---

# Integrações e Storage (WGOTalent)

Este documento estabelece as regras de ouro para o motor de agentes nativo e para o upload, manipulação e armazenamento de arquivos no sistema WGOTalent.

## 1. Motor de Agentes Nativo (Gemini + OpenAI)

- **IA Interna, multi-provedor:** Chamadas de IA são internas à aplicação via `src/lib/agents/agent-client.ts` (dispatcher único), que despacha para `gemini-client.ts` (`@google/genai`, provedor Gemini/Google AI Studio) ou `openai-client.ts` (Responses API da OpenAI, `fetch` nativo) conforme `agenteConfig.provider` — nenhum agente importa um client de provedor diretamente. Não requerem shared secret de webhook, eliminando a antiga arquitetura via n8n (conforme decidido no **ADR-0007**; segundo provedor decidido na **ADR-0011**).
- **Assincronismo e Fire-and-Forget:** Chamadas para o motor de agentes devem ser fire-and-forget e assíncronas. Recomenda-se utilizar a função `after()` (disponível no Next.js) para garantir que não bloqueiem a transação principal de banco de dados (ex: salvar um candidato ou vaga).
- **Chamada direta ao provedor de LLM é esperada, webhook intermediário não:** os clients de provedor (`gemini-client.ts`, `openai-client.ts`) fazem chamadas HTTP legítimas e esperadas direto para a API do provedor de IA (Google AI Studio / OpenAI) — isso não é a arquitetura proibida. O que continua proibido é reintroduzir um salto de webhook para um serviço de orquestração externo (ex: n8n) entre a aplicação e o provedor de IA. Da mesma forma, o cliente IMAP (`src/lib/email/imap-client.ts`, ver **ADR-0010**) faz conexão direta e legítima com a caixa de e-mail configurada — não é um workaround a evitar.

## 2. Upload e Armazenamento (Storage)

- **Armazenamento Fora da Pasta Public:** Currículos, documentos pessoais e demais arquivos de candidatos **NUNCA** devem ser salvos na pasta `/public`. O storage (local, S3, etc) deve ser isolado e os arquivos consumidos via rotas seguras que validem autorização.
- **Impedir Path Traversal:** O nome original do arquivo jamais deve ser usado cegamente. Sempre sanitize as chaves, caminhos ou nomes de arquivos recebidos via upload/download para evitar ataques de *path traversal* (ex: uso de `../`). Use bibliotecas ou converta os nomes para UUIDs/Hashes seguros.

## 3. Segurança e Privacidade (PII)

- **Proibido Logar Payloads Completos:** É estritamente proibido gravar no log (console, serviços de log, etc.) currículos, dados completos de candidatos ou payloads integrais oriundos de webhooks. 
- **Somente Metadados:** Se precisar logar eventos de integração, faça-o apenas com metadados cruciais (IDs, Status HTTP) sem expor PII (Personally Identifiable Information).