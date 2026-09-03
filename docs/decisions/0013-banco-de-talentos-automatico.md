# 13. Banco de Talentos Automático para Candidatos sem Vaga Compatível

## Status

Aceita

* **Relacionado a:** [ADR-0007: Encerramento da Integração via n8n e Adoção de Motor de Agentes Nativo](./0007-encerramento-integracao-n8n.md)

## Contexto

A orquestração de matching (`orquestrarParaCandidatoNovo` em
[src/server/agents/orquestracao.ts](../../src/server/agents/orquestracao.ts))
roda sempre que um candidato novo é capturado (upload manual, upload em lote
ou captação por e-mail — ADR-0010). Ela busca vagas abertas na cidade do
candidato e usa o agente `classificador_aderencia` para decidir quais pares
candidato-vaga viram `Triagem`.

Até esta decisão, quando nenhuma vaga aberta existia na cidade do candidato,
ou nenhuma vaga atingia o score mínimo do classificador, a função
simplesmente retornava sem criar nada — o candidato ficava cadastrado sem
nenhum sinal para o RH de que ele não tinha vaga compatível no momento.

O enum `triagem_resultado` já inclui o valor `"banco_talentos"`, mas ele é
um desfecho de uma `Triagem` já existente (`vaga_id` é `NOT NULL` em
`triagens`) — ou seja, hoje só existe como escolha manual do RH em um
processo seletivo já iniciado para uma vaga específica. Isso não cobre o
caso de um candidato que nunca teve nenhuma vaga compatível: não há
`Triagem` nenhuma para marcar.

## Decisão

"Banco de talentos" geral (sem vaga associada) passa a ser uma propriedade
do próprio `Candidato`, não da `Triagem`: novo campo booleano
`em_banco_talentos` (default `false`).

1. **Gatilhos automáticos**, ambos dentro de `orquestrarParaCandidatoNovo`:
   - Nenhuma vaga aberta na cidade do candidato (`vagasAbertas.length === 0`).
   - Vagas existem, mas nenhuma atinge a nota de corte configurada na própria vaga
     (`aprovados.length === 0`).
   Em ambos os casos, `candidatoRepository.marcarBancoTalentos(candidatoId)`
   é chamado em vez do retorno silencioso anterior.
2. **Reavaliação automática**: `orquestrarParaVagaNova` já varre todos os
   candidatos ativos (não deletados) da cidade de uma vaga nova, incluindo os
   que estão no banco de talentos — não precisou de nenhuma mudança de
   filtro para isso. Quando esse fluxo (ou uma nova captação futura do mesmo
   candidato) efetivamente cria uma `Triagem` para um candidato, o candidato
   sai do banco automaticamente (`desmarcarBancoTalentos`), centralizado em
   `processarParAprovado` — ponto único onde uma `Triagem` nova é de fato
   criada, compartilhado pelos dois sentidos de orquestração.
3. **Sem UI de edição manual do campo por ora**: o valor é 100% derivado da
   orquestração automática. O RH continua podendo usar `resultado =
   banco_talentos` numa `Triagem` específica para o caso "esse candidato não
   segue para *esta* vaga, mas continua interessante" — os dois conceitos
   coexistem e não se confundem (um é do candidato em geral, o outro é do
   par candidato-vaga).

## Consequências

- **Positivas:** mudança aditiva ao schema de `Candidato` (uma coluna
  booleana com default), sem alterar `Triagem`/`AvaliacaoIA` nem a
  constraint `UNIQUE(candidato_id, vaga_id)`. Reaproveita o valor de UI já
  existente para `banco_talentos` em `statusConfigMap`
  ([status-badge.tsx](../../src/components/status-badge.tsx)). Dá visibilidade
  ao RH sobre candidatos sem vaga compatível, que antes ficavam invisíveis.
- **Trade-offs:** não reavalia retroativamente candidatos cujas triagens
  existentes terminaram todas em reprovado/desistente sem nenhuma vaga
  alternativa disponível — esses só entram no banco de talentos se passarem
  de novo por `orquestrarParaCandidatoNovo` (ex.: reprocessamento por
  duplicidade) ou tiverem sido capturados depois desta decisão. Considerado
  aceitável para o escopo pedido (momento de intake), podendo virar um
  job de reavaliação periódica no futuro se necessário.

## Alternativas

- **Triagem sintética com `vaga_id` nulo e `resultado = banco_talentos`**:
  descartada — exigiria tornar `vaga_id` opcional em `triagens` (mexendo na
  unique constraint `(candidato_id, vaga_id)` e no índice parcial do
  ADR-0008), além de sobrecarregar o significado de `Triagem`, que hoje é
  sempre um processo seletivo ligado a uma vaga concreta com etapas de funil
  (`etapa`, `parecer_rh_<etapa>`) que não fariam sentido sem vaga.
