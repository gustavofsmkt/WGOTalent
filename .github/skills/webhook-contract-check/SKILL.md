---
description: Verifica os contratos de integração com webhooks (especialmente n8n), garantindo as restrições de arquitetura.
---
# Webhook Contract Check

Use esta skill ao implementar, revisar ou documentar integrações externas e webhooks do n8n.

## Regras e Verificações
1. **Isolamento de Banco de Dados**: O n8n NUNCA deve escrever ou ler diretamente do banco de dados do projeto.
2. **Consumo/Orquestração**: Toda a interação do n8n ocorre através de webhooks ou APIs REST expostas pelo Next.js (Route Handlers / Server Actions).
3. **Contrato Rigoroso**: Os payloads de webhook recebidos/enviados devem ser rigidamente validados via esquemas Zod (`z.object(...)`).

Consulte `.github/instructions/integrations.instructions.md` e `docs/ARCHITECTURE.md`.
