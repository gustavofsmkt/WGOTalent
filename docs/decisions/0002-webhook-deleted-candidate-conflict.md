# ADR 0002: Comportamento do Webhook para Candidato com Soft Delete

## Status

Obsoleta

* **Superseded-by:** [0008](./0008-candidato-duplicado-restaurar-e-mesclar.md)

## Contexto

- A tabela de candidatos possui uma restrição `UNIQUE` simples para a coluna `email`.
- O sistema implementa o padrão *soft delete* (`deleted_at`), o que significa que a exclusão de um candidato apenas oculta o registro, mas não libera o e-mail no banco de dados.
- O webhook de entrada (ex: integração com n8n) processa currículos e cadastra novos candidatos.
- Quando o webhook recebe um payload com um e-mail que pertence a um candidato previamente excluído (soft-deleted), precisamos decidir se a API deve reativar o candidato silenciosamente, criar um novo ou rejeitar a requisição.

## Decisão

- A decisão padrão e segura é **rejeitar o payload do webhook** e retornar um erro de conflito de domínio (HTTP 409 Conflict ou similar).
- **Não criar um novo candidato:** A restrição `UNIQUE` continuará simples. Não criaremos múltiplos registros com o mesmo e-mail.
- **Não reativar silenciosamente:** O webhook não removerá a flag `deleted_at` como efeito colateral do recadastro.
- **Ação explícita do RH:** Qualquer reativação de um candidato excluído deverá ser uma ação consciente, manual e explícita realizada pela equipe de RH por meio da interface do sistema.

## Consequências

- **Positivas:** 
  - Evita a reativação acidental ou automatizada de candidatos que foram banidos, rejeitados definitivamente ou solicitaram a remoção de seus dados.
  - Mantém a previsibilidade do webhook, que foca apenas na criação e atualização de registros ativos.
  - O histórico do candidato permanece unificado no mesmo registro do banco de dados.
- **Negativas:** 
  - Se um candidato deletado tentar se recadastrar legitimamente, o processo automatizado falhará, exigindo que o candidato ou a equipe de RH intervenham manualmente para realizar a reativação.

## Alternativas

- **Tornar o UNIQUE parcial (apenas para não-deletados):** Descartada. Permitiria que um mesmo e-mail (uma mesma pessoa física) tivesse vários registros no banco de dados, fragmentando seu histórico e a rastreabilidade.
- **Reativação automática no webhook (Upsert com undelete):** Descartada. Anularia a decisão original de exclusão sem registro de auditoria adequado (quem reativou e o porquê), podendo violar regras de governança ou exclusão a pedido do usuário (LGPD).
