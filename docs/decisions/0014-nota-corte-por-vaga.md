# 14. Nota de Corte de Aderência Configurada por Vaga

## Status

Aceita

* **Relacionado a:** [ADR-0007: Encerramento da Integração via n8n e Adoção de Motor de Agentes Nativo](./0007-encerramento-integracao-n8n.md)

## Contexto

O Classificador de Aderência produz um score para cada par candidato-vaga. A
nota mínima para criar uma triagem era uma configuração única do agente na
área administrativa, fazendo vagas com perfis, senioridades e níveis de
exigência diferentes compartilharem o mesmo limite.

## Decisão

A nota de corte passa a pertencer à entidade `Vaga` e é editada nos formulários
de criação e edição da vaga. O modelo canônico e a implementação estão em
[`docs/db_triagem_proposta.ts`](../db_triagem_proposta.ts) e
[`src/server/db/schema.ts`](../../src/server/db/schema.ts).

Ao classificar um candidato contra várias vagas, a aplicação compara cada score
com a nota da vaga correspondente. Ao classificar candidatos para uma vaga
nova, usa a nota dessa vaga. A configuração administrativa do agente permanece
responsável apenas pelo provedor, modelo, prompts e estado ativo.

A migração copia o antigo limite global para todas as vagas existentes antes de
removê-lo da configuração do agente. Novas vagas recebem 65 como valor inicial.

## Consequências

- O RH pode ajustar a seletividade de cada processo sem afetar outras vagas.
- O comportamento anterior é preservado para vagas existentes durante a
  migração.
- A orquestração precisa manter a associação entre o score retornado e a vaga
  correspondente ao aplicar o filtro.
- A nota é obrigatória e limitada entre 0 e 100 na validação da aplicação e no
  banco de dados.

## Alternativas

- **Manter um limite global no agente:** descartada porque não representa as
  diferenças de exigência entre vagas.
- **Permitir sobrescrita opcional por vaga com fallback global:** descartada
  por manter duas fontes de verdade e tornar o resultado menos previsível para
  o RH.
