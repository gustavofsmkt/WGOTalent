# Auditoria de Especificações (SPEC_AUDIT)

Abaixo estão classificadas as regras, questões, necessidades de decisão e critérios derivados a partir das especificações canônicas (`db_triagem_proposta.ts` e `hr-platform-nextjs-architecture-prompt.md`).

## 1. Regras Fechadas

*   **Arquitetura Base:** Next.js App Router (Server Components para leitura, Server Actions para escrita interna, Route Handlers para stream de arquivos e eventuais integrações).
*   **Soft Delete Universal:** Todas as entidades possuem a coluna `deleted_at`. Leituras devem usar helper centralizado `notDeleted`.
*   **Unique Simples + Soft Delete:** Constraints `UNIQUE` (como `Departamento.nome` e `Candidato.email`) são aplicadas diretamente. O soft delete não libera esses valores para reuso, impedindo recriações com os mesmos dados básicos intencionalmente.
*   **Delete em Cascata na Aplicação:** A exclusão de um Candidato exige atualização manual de `deleted_at` para suas Formações, Experiências, Certificações e Triagens na mesma transação, sem uso de `ON DELETE CASCADE` do banco de dados.
*   **Unique Simples de Triagem por Candidato/Vaga:** Existe um índice único `UNIQUE (candidato_id, vaga_id)` (sem cláusula `WHERE`) que impede mais de uma triagem do mesmo candidato para a mesma vaga, independentemente do `resultado`. O índice parcial cogitado anteriormente foi removido em `2a6c917` para alinhar com o spec canônico (`db_triagem_proposta.ts:184-185`).
*   **Status de Triagem:** Dividido fisicamente em `etapa` e `resultado`. O `motivo` é obrigatório apenas para resultados de "reprovado" ou "desistente", precisando de validação condicional rigorosa.
*   **AvaliacaoIA Inline:** A entidade AvaliacaoIA é relação 1:1 com Triagem e exibida em conjunto. Não possui CRUD próprio ou interface separada.
*   **Armazenamento de Currículos:** Arquivos de currículos devem utilizar o `StorageProvider`, ficando fora de `public/` e sendo servidos através de `/api/files/[...path]/route.ts`.
*   **Webhook Autenticado:** Triagem de IA executada nativamente pela plataforma via motor de agentes configurável (ver ADR-0007).

## 2. Questões Explicitamente Abertas

*   **`texto_curriculo_extraido` marcado como dúvida:** A especificação questiona se esse campo bruto deve ser persistido (`// precisamos?`).
*   **Payload de IA:** O contrato de entrada/saída do motor de agentes nativo (system prompt, user prompt, variáveis por slot, schema de resposta) ainda não está formalizado — ver ADR-0007 para a decisão de arquitetura; o desenho detalhado (etapas de classificação/avaliação, schema de score) é escopo da nova Fase 14.
*   **Idempotência da IA:** O schema atual não prevê chave de desduplicação ou mecanismo para lidar com múltiplas avaliações seguidas da mesma candidatura.
*   **Candidato soft-deleted recebido novamente:** A arquitetura aponta como uma questão aberta como lidar na rota webhook quando os dados chegam para um `Candidato.email` cujo registro anterior se encontra soft-deleted.

## 3. Decisões que Exigem ADR Antes do Schema

*   **Retenção do `texto_curriculo_extraido`:** ADR definindo se o conteúdo extraído do currículo será descartado em favor dos dados estruturados (redução de PII/custo) ou mantido para auditoria.
*   **Idempotência do Webhook:** ADR determinando como prevenir inserções duplicadas, exigindo definição de chave (`x-idempotency-key`) e eventual ajuste no schema.
*   **Comportamento para Candidato Soft-deleted Recebido Novamente:** ADR decidindo se o webhook rejeita a requisição, ou qual será o fluxo operacional de reativação (impedindo a reativação silenciosa automatizada).
*   **Semântica de Delete de Departamento/Cargo/Vaga com Dependências:** ADR para padronizar as regras de exclusão organizacional (ex.: impedir deleção de Departamento com Cargos ativos, Cargo com Vagas ativas, e o tratamento das Triagens históricas de uma Vaga cancelada ou excluída).

## 4. Critérios de Aceitação Derivados

*   **Completude CRUD:** As entidades Departamento, Cargo, Vaga, Candidato e Triagem são gerenciáveis via interfaces criadas com Server Components e Server Actions.
*   **Prevenção de Duplicidade:** O frontend e o backend interceptam a constraint `UNIQUE (candidato_id, vaga_id)` e impedem a criação de uma segunda triagem para o mesmo par candidato/vaga, seja qual for o `resultado` da triagem existente.
*   **Integridade Referencial na UI:** Os formulários exibem apenas opções ativas (Departamentos para Cargos; Cargos para Vagas; Vagas e Candidatos para Triagem) buscadas via servidor (sem API routes).
*   **Transações Seguras:** Qualquer operação composta (Criação do Candidato com currículo e filhos, exclusão do Candidato em cascata, webhook criando Candidato, Triagem e AvaliacaoIA) roda num bloco de transação única com _rollback_ em falha.
*   **Validação Estrita do Status de Triagem:** Schemas do Zod bloqueiam salvamento (tanto no form quanto no webhook) se o `motivo` for fornecido em resultados inapropriados ou faltar em reprovações e desistências, de forma pareada aos enumeradores do schema.
*   **Processamento Completo da Avaliação:** A criação/atualização de Candidato, Vaga, Triagem e AvaliacaoIA deve continuar validando todos os dados complexos, protegendo contra reativação indevida de registros soft-deleted, e revalidando as interfaces do RH (`revalidatePath`) — agora via Server Actions e o motor de agentes nativo (ver ADR-0007), não mais via uma rota de webhook externo.
*   **Reflexo Imediato de Dados:** Funções de listagem são revalidadas adequadamente, não exibindo em tela itens com `deleted_at` preenchido.
