# ADR 0008: Candidato Duplicado por E-mail — Restaurar e Mesclar em Vez de Rejeitar

## Status

Aceita

* **Supersedes:** [0002](./0002-webhook-deleted-candidate-conflict.md)

## Contexto

A ADR 0002 decidiu que, ao receber um cadastro (via webhook n8n, na época)
com e-mail de um candidato já excluído (soft delete), o sistema deveria
**rejeitar** a operação e nunca reativar automaticamente — reativação
deveria ser sempre uma ação manual e consciente do RH, por motivos de
LGPD/trilha de auditoria.

Com a extinção do n8n (ver [ADR 0007](./0007-encerramento-integracao-n8n.md))
e o motor de agentes nativo, os dois pontos de entrada de cadastro de
candidato — formulário manual (`createCandidato`) e upload em lote de
currículos (`processarArquivoLote`), ambos em
[`src/actions/candidatos.ts`](../../src/actions/candidatos.ts) — continuam
com o mesmo comportamento herdado da ADR 0002: qualquer e-mail já
cadastrado (ativo ou excluído) faz o cadastro falhar com uma mensagem de
erro, sem nenhuma ação além disso.

Na prática, isso gera dois problemas recorrentes:

1. Um candidato que teve seu cadastro excluído e tenta se recadastrar
   legitimamente (ou tem seu currículo reenviado) é sempre rejeitado — a
   única saída era uma intervenção manual no banco, já que não existe (e
   nunca existiu) nenhuma tela ou ação de "restaurar candidato" no sistema.
2. Um candidato ativo que reenvia o currículo com informações atualizadas
   (novo telefone, nova formação, currículo revisado) também é rejeitado
   integralmente — a informação nova se perde, e o RH não é avisado de que
   havia algo novo para conferir.

## Decisão

Substituímos a decisão da ADR 0002. O e-mail continua sendo a única chave
de correspondência de candidato (não existe campo CPF na tabela
`candidatos`, e a decisão foi não adicionar um agora). Ao encontrar um
e-mail já cadastrado:

- **Candidato excluído (soft delete):** o cadastro é **restaurado** em vez
  de rejeitado. Os campos escalares do candidato são recalculados com
  `mergeScalarFields` (ver `src/server/db/repositories/candidato.ts`) —
  os dados de antes da exclusão continuam valendo, exceto onde o novo
  envio traz algo novo/diferente e não vazio. `deletedAt` é limpo. As
  formações/experiências/certificações do novo envio são inseridas como
  linhas novas; os filhos antigos (e as triagens/avaliações de IA
  anteriores) permanecem soft-deleted, como histórico — a restauração
  recria o candidato, não ressuscita o histórico de triagem antigo. Em
  seguida, `orquestrarParaCandidatoNovo` é disparado para o candidato
  voltar a entrar no fluxo de matching/triagem.
- **Candidato ativo:** os dados são **mesclados** com `mergeAggregate` —
  campos escalares seguem a mesma regra aditiva de `mergeScalarFields`
  (nunca apaga um dado já preenchido com um valor vazio do novo envio;
  campos booleanos só ligam, nunca desligam, já que o Zod aplica
  `default(false)` quando o campo não vem no envio e um `false` novo é
  indistinguível de "não informado"); formações/experiências/certificações
  são mescladas por adição (mantém tudo que já existe, insere só os itens
  novos sem equivalente já cadastrado). Se houve alguma mudança real
  (`houveMudanca`), e o candidato ainda tiver triagens na etapa inicial
  **"Currículo"** com `resultado = 'em_andamento'`, essas triagens são
  excluídas (`triagemRepository.softDelete`) e `orquestrarParaCandidatoNovo`
  é disparado de novo — a avaliação inicial é refeita em cima do perfil
  atualizado. Triagens em etapas mais avançadas (testes, entrevista RH,
  entrevista gestor, finalizado) nunca são tocadas automaticamente.

### Correção de base: `existsForPar` e o índice único de triagens

O índice único parcial `triagens_candidato_vaga_idx` (schema.ts) e o
método `triagemRepository.existsForPar` tratavam qualquer linha existente
para um par `(candidatoId, vagaId)` como bloqueio para uma nova triagem —
mesmo se essa linha já estivesse soft-deleted. Isso impedia, na prática,
que a restauração ou a mesclagem devolvessem o candidato ao fluxo de
triagem para vagas que ele já havia sido avaliado antes. Corrigimos ambos
para considerar `deleted_at IS NULL`:

- O índice único parcial passou a exigir `resultado = 'em_andamento' AND
  deleted_at IS NULL` (migration `drizzle/0013_confused_mystique.sql`).
- `existsForPar` passou a usar o helper `notDeleted()`, como o resto do
  repositório.

## Consequências

- **Positivas:**
  - Um candidato que se recadastra (ou tem o currículo reenviado) depois
    de excluído volta a existir automaticamente, com o mesmo `id` e sem
    duplicar e-mail no banco.
  - Informação nova enviada por um candidato já ativo não se perde mais —
    é incorporada ao cadastro existente automaticamente, sem exigir edição
    manual do RH.
  - Um candidato ainda na primeira etapa da triagem, com dados
    desatualizados, é reavaliado com o perfil correto em vez de manter uma
    avaliação de IA baseada em informação obsoleta.
- **Negativas:**
  - Reverte a garantia de auditoria da ADR 0002: a reativação de um
    candidato excluído deixa de exigir uma ação manual e consciente do RH.
    Se um candidato foi excluído por pedido de remoção de dados (LGPD) ou
    por decisão definitiva do RH (ex.: banido do processo seletivo), um
    recadastro com o mesmo e-mail o traz de volta sem intervenção humana.
  - Efeito colateral da correção do `existsForPar`: se o RH excluir
    manualmente uma triagem específica de um candidato (`deleteTriagem`),
    e esse mesmo candidato depois passar por uma restauração ou mesclagem
    com dado novo, o motor de matching pode voltar a criar uma triagem
    nova para aquele mesmo par candidato+vaga. Antes desta ADR, isso nunca
    acontecia.

## Alternativas

- **Manter a rejeição da ADR 0002 e criar uma tela de "restaurar
  candidato" manual:** mais alinhada com a garantia de auditoria original,
  mas não resolve o caso de mesclagem de informação nova em um candidato
  ativo, e exige mais trabalho manual do RH para o caso comum de
  recadastro legítimo. Descartada a pedido explícito do usuário.
- **Resetar a triagem "Currículo" no lugar (sem excluir/recriar):** em vez
  de excluir a triagem e deixar o motor de matching recriá-la, apenas
  atualizar a linha existente de volta para o estado inicial. Evitaria
  mexer no índice único e no `existsForPar`, mas não cobre o caso de
  restauração (vagas que abriram depois da exclusão do candidato não
  entrariam no fluxo) e foi descartada em favor de corrigir a causa raiz.
