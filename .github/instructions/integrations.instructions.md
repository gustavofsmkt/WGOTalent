---
description: "Diretrizes para integrações externas (n8n, webhooks) e armazenamento (storage) de arquivos."
applyTo: 
  - "src/app/api/webhooks/**"
  - "src/app/api/files/**"
  - "src/lib/storage/**"
---

# Integrações e Storage (WGOTalent)

Este documento estabelece as regras de ouro para integrações externas (com ênfase no n8n) e para o upload, manipulação e armazenamento de arquivos no sistema WGOTalent.

## 1. Integrações (N8N e Webhooks)

- **N8N Externo e Sem Acesso ao DB:** O n8n é uma ferramenta externa. Ele **NUNCA** deve receber a variável `DATABASE_URL` e não escreve diretamente no banco de dados. Qualquer interação com os dados deve ser feita consumindo endpoints/webhooks da aplicação Next.js.
- **Next.js como Source of Truth:** O backend da aplicação (Next.js) é a única fonte da verdade e o guardião exclusivo do banco de dados.
- **Shared Secret:** Todas as rotas de webhook e APIs de integração devem ser autenticadas através de um *shared secret* verificado nos headers da requisição.
- **Zod Boundary:** Assim que o payload de um webhook/integração for recebido, ele deve ser imediatamente validado contra um schema rígido do Zod.
- **Idempotência:** A lógica de processamento de webhooks deve ser idempotente, permitindo repetições (retries) seguras sem duplicar dados ou disparar efeitos colaterais repetidos.
- **Transactions:** Quando a integração causar mudanças em múltiplas entidades no banco de dados, utilize transações (`db.transaction()`) para evitar inconsistências.
- **Cleanup Contínuo:** Quando alterar contratos de dados, payloads de webhook ou substituir lógicas antigas, garanta a exclusão do código e das rotas substituídas (*cleanup*).

## 2. Upload e Armazenamento (Storage)

- **Armazenamento Fora da Pasta Public:** Currículos, documentos pessoais e demais arquivos de candidatos **NUNCA** devem ser salvos na pasta `/public`. O storage (local, S3, etc) deve ser isolado e os arquivos consumidos via rotas seguras que validem autorização.
- **Impedir Path Traversal:** O nome original do arquivo jamais deve ser usado cegamente. Sempre sanitize as chaves, caminhos ou nomes de arquivos recebidos via upload/download para evitar ataques de *path traversal* (ex: uso de `../`). Use bibliotecas ou converta os nomes para UUIDs/Hashes seguros.

## 3. Segurança e Privacidade (PII)

- **Proibido Logar Payloads Completos:** É estritamente proibido gravar no log (console, serviços de log, etc.) currículos, dados completos de candidatos ou payloads integrais oriundos de webhooks. 
- **Somente Metadados:** Se precisar logar eventos de integração, faça-o apenas com metadados cruciais (IDs, Status HTTP) sem expor PII (Personally Identifiable Information).