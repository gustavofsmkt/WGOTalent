---
description: "Diretrizes para o motor de agentes nativo (IA) e armazenamento (storage) de arquivos."
applyTo: 
  - "src/actions/**"
  - "src/app/api/**"
  - "src/lib/storage/**"
---

# Integrações e Storage (WGOTalent)

Este documento estabelece as regras de ouro para o motor de agentes nativo e para o upload, manipulação e armazenamento de arquivos no sistema WGOTalent.

## 1. Motor de Agentes Nativo (Vercel AI SDK)

- **IA Interna:** Chamadas de IA são internas à aplicação (utilizando o Vercel AI SDK) e **NÃO** requerem shared secret de webhook, eliminando a antiga arquitetura via n8n (conforme decidido no **ADR-0007**).
- **Assincronismo e Fire-and-Forget:** Chamadas para o motor de agentes devem ser fire-and-forget e assíncronas. Recomenda-se utilizar a função `after()` (disponível no Next.js) para garantir que não bloqueiem a transação principal de banco de dados (ex: salvar um candidato ou vaga).
- **TODOs Explícitos (Fase 14):** Até que o motor de agentes nativo seja completamente implementado (na nova Fase 14), qualquer ponto de código que precise disparar um agente (como o `classificador_aderencia`) deve ser implementado como um comentário de `TODO` explícito referenciando o **ADR-0007**.
- **Proibido Chamadas HTTP Externas:** **NUNCA** implemente chamadas HTTP de fato para uma URL externa (como disparos de webhooks para o n8n). Mantenha tudo no design nativo.

## 2. Upload e Armazenamento (Storage)

- **Armazenamento Fora da Pasta Public:** Currículos, documentos pessoais e demais arquivos de candidatos **NUNCA** devem ser salvos na pasta `/public`. O storage (local, S3, etc) deve ser isolado e os arquivos consumidos via rotas seguras que validem autorização.
- **Impedir Path Traversal:** O nome original do arquivo jamais deve ser usado cegamente. Sempre sanitize as chaves, caminhos ou nomes de arquivos recebidos via upload/download para evitar ataques de *path traversal* (ex: uso de `../`). Use bibliotecas ou converta os nomes para UUIDs/Hashes seguros.

## 3. Segurança e Privacidade (PII)

- **Proibido Logar Payloads Completos:** É estritamente proibido gravar no log (console, serviços de log, etc.) currículos, dados completos de candidatos ou payloads integrais oriundos de webhooks. 
- **Somente Metadados:** Se precisar logar eventos de integração, faça-o apenas com metadados cruciais (IDs, Status HTTP) sem expor PII (Personally Identifiable Information).