# Architecture Decision Records (ADRs)

Este diretório contém os registros de decisões arquiteturais (ADRs) do projeto WGOTalent.

## Índice

- [0001: Retenção de Texto do Currículo e JSON do Agente](./0001-resume-text-and-agent-json-retention.md)
- [0002: Comportamento do Webhook para Candidato com Soft Delete](./0002-webhook-deleted-candidate-conflict.md)
- [0003: Semântica de Soft Delete Organizacional e Efeito Cascata](./0003-organizational-soft-delete-semantics.md)
- [0004: Mapeamento de Campos n8n para Banco de Dados](./0004-n8n-webhook-field-mapping.md)
- [0005: Disparo Outbound para n8n Classificador](./0005-outbound-classifier-trigger.md)
- [0006: n8n como Serviço no Docker Compose](./0006-n8n-docker-compose-service.md)
- [0007: Encerramento da Integração via n8n e Adoção de Motor de Agentes Nativo](./0007-encerramento-integracao-n8n.md)
- [0008: Candidato Duplicado por E-mail — Restaurar e Mesclar em Vez de Rejeitar](./0008-candidato-duplicado-restaurar-e-mesclar.md)

---

## Template de ADR

Ao registrar uma nova decisão, crie um arquivo com o padrão `NNNN-nome-da-decisao.md` (ex: `0001-use-drizzle-orm.md`) e utilize a estrutura abaixo:

```markdown
# [Título da Decisão]

## Status

[Proposta | Aceita | Rejeitada | Obsoleta]

* **Supersedes:** [Link para a decisão que esta substitui, se aplicável]
* **Superseded-by:** [Link para a decisão que substitui esta, se aplicável]

## Contexto

[Qual é o contexto, o problema ou a motivação que exige uma decisão? Liste restrições, requisitos e forças envolvidas.]

## Decisão

[Qual foi a decisão final tomada? Descreva de maneira clara a solução escolhida.]

## Consequências

[O que melhora e o que piora com esta decisão? Quais são os impactos (positivos e negativos) técnicos, operacionais ou de negócio?]

## Alternativas

[Quais outras opções foram analisadas e por que foram descartadas?]
```