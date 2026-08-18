# Encerramento da Integração via n8n e Adoção de Motor de Agentes Nativo

## Status

Aceita

* **Supersedes:** [0006: n8n como Serviço no Docker Compose](./0006-n8n-docker-compose-service.md) (integralmente). Supersedes parcialmente: [0004: Mapeamento de Campos n8n para Banco de Dados](./0004-n8n-webhook-field-mapping.md) e [0005: Disparo Outbound para n8n Classificador](./0005-outbound-classifier-trigger.md) (o que sobrevive destas decisões será tratado em suas respectivas emendas).

## Contexto

O projeto planejava orquestrar a triagem de IA via n8n (workflows Cadastro_Candidato, Classificador, Triagem), documentado em ADR-0004, ADR-0005, ADR-0006 e N8N_WEBHOOK_CONTRACT.md. Nenhuma dessas integrações foi implementada em código ainda — a decisão foi tomada antes da implementação, o que reduz o custo da mudança.

## Decisão

Mover toda a orquestração de IA (extração de currículo, classificação de aderência, avaliação/triagem) para dentro da própria plataforma, como um motor de agentes configurável via admin (modelo/provedor/system prompt/user prompt/parâmetros por slot fixo), sem depender de n8n.

Formatos de currículo suportados no MVP: PDF, DOCX, PNG, JPEG — DOCX via mammoth, sem serviço de conversão externo. Captação via upload manual (recrutador) e via provedor de e-mail configurável (Zimbra/Microsoft 365/Google Workspace), com credenciais de LLM e de e-mail cadastradas via admin, cifradas em repouso.

## Consequências (Justificativa)

Os 3 fluxos n8n analisados são pipelines sequenciais (extração → classificação → avaliação) sem orquestração complexa que justifique um motor de workflow externo. Trazer isso para dentro da plataforma permite:
- Configuração de prompts, provedores e modelos diretamente via interface admin sem necessidade de deploy.
- Eliminação dos saltos de webhook entre a plataforma e o n8n em cada etapa de avaliação.
- Concentração de logs, auditoria e rastreio de custo de chamadas de IA num só lugar, facilitando a gestão.

## Alternativas

A alternativa era seguir com a arquitetura descrita em ADR-0006, em que a IA seria orquestrada pelo n8n. Contudo, essa opção aumentaria a superfície de infraestrutura a manter, traria latência de chamadas HTTP (webhooks de ida e volta), e descentralizaria o gerenciamento de chaves e prompts fora da plataforma.
