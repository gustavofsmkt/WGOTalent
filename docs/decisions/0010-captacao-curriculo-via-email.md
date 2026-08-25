# 10. Captação de Currículo via E-mail (IMAP)

## Status

Aceita

* **Relacionado a:** [ADR-0007: Encerramento da Integração via n8n e Adoção de Motor de Agentes Nativo](./0007-encerramento-integracao-n8n.md)

## Contexto

O ADR-0007 já descrevia a captação via e-mail (Zimbra/Microsoft 365/Google
Workspace) como direção de produto, mas a deixava fora do MVP inicial (ver
[README.md — Motor de Agentes IA](../README.md#motor-de-agentes-ia)). Depois
do fechamento do marco greenfield (`wgo-greenfield-v1`, TASK-130), decisão de
produto: antecipar essa captação para **dentro do MVP atual**, antes de
seguir para a fase de containerização de produção.

A arquitetura já antecipava essa origem: `origemEnum` em
[schema.ts](../../src/server/db/schema.ts) já inclui `"email"` ao lado de
`"manual"` e `"indicacao"`. A orquestração de IA
([src/server/agents/orquestracao.ts](../../src/server/agents/orquestracao.ts))
já é uma função pura sem nenhuma API request-scoped do Next.js
(`revalidatePath`, `cookies()`, etc.), então é segura para ser chamada a
partir de um processo em background, não só de uma Server Action.

**Achado durante a análise que motivou parte desta decisão**: o upload em
lote existente tinha um bug — `processarItemLote` nunca setava `origem`
explicitamente, então todo candidato criado por IA (mesmo vindo de upload
humano) caía no default Zod `"manual"`. A implementação desta ADR corrige
isso ao extrair o processamento compartilhado e forçar `origem`
explicitamente nos dois caminhos.

## Decisão

Protocolo: **IMAP genérico** (não Microsoft Graph API) — cobre Zimbra,
Google Workspace e M365 com IMAP habilitado sem SDK proprietário por
provedor. Execução: **loop interno no processo Next.js**, via
`instrumentation.ts` (hook oficial do Next.js para código de bootstrap do
servidor), não cron externo nem route handler acionado de fora.

1. **Novo produtor de eventos**, não reescrita do pipeline existente: um
   loop de captura baixa anexos elegíveis (PDF/DOCX/PNG/JPEG) de uma caixa
   IMAP configurada e os injeta no mesmo processamento
   (`processarCurriculoRecebido`, extraído de `processarItemLote`) que hoje
   atende o upload em lote — só muda o valor de `origem` (`"email"` em vez
   de `"manual"`).
2. **Credenciais cifradas em repouso** reaproveitando o padrão já usado para
   LLM: mesma cifra AES-256-GCM
   ([src/lib/agents/crypto.ts](../../src/lib/agents/crypto.ts)), mesma chave
   mestra `AGENT_CREDENTIALS_ENCRYPTION_KEY` — nenhuma env var obrigatória
   nova. Nova tabela `wgotalent_email_credenciais` (host, porta, usuário,
   senha cifrada, pasta monitorada, watermark de UID, ativo), análoga a
   `wgotalent_llm_credenciais`, mas com regra de aplicação mais estrita: só
   uma credencial ativa por vez (uma única caixa monitorada).
3. **UI admin**: nova aba "Captação de E-mail" dentro da página única
   `/admin` (não uma rota nova — segue o padrão já usado por Agentes e
   Credenciais, que também são abas, não rotas próprias).
4. **Idempotência via watermark de UID IMAP** (`ultimoUidProcessado`),
   monotônico e por-mailbox — não relógio, não flag `\Seen` (frágil se
   alguém mais ler a mesma caixa). Só avança depois que o ciclo de captura
   termina; se o ciclo falhar no meio, reprocessar o mesmo range é seguro
   porque o dedup por e-mail/celular já existente trata isso como merge, não
   duplicação. Isso substitui, para este fluxo, o modelo de idempotência de
   webhook descartado no ADR-0007 (que era acoplado a HTTP inbound do n8n).
   Na **primeira captura** (`ultimoUidProcessado` nulo), o watermark inicia
   no `uidNext` atual do mailbox, não em UID 1 — a busca nunca varre o
   histórico existente da caixa, só o que chegar dali em diante. Foi
   descoberto durante o teste manual com Gmail pessoal: um watermark
   começando em 1 fez o primeiro ciclo tentar buscar e processar mais de
   19 mil mensagens já existentes na caixa, travando o loop indefinidamente
   (guarda de sobreposição nunca liberava). O watermark avança para o
   `uidNext - 1` observado mesmo quando zero mensagens novas são
   encontradas nesse primeiro ciclo — sem isso, cada ciclo repetiria a
   decisão de "pular o histórico" para sempre, em vez de persisti-la uma
   vez.
5. **Novas dependências** (aprovadas explicitamente pelo usuário):
   `imapflow` (cliente IMAP) + `mailparser` (parsing MIME/anexos) +
   `@types/mailparser`.
6. **Backfill opcional e limitado por data na ativação** — campo "Capturar
   e-mails a partir de" (data) no cadastro da credencial, coluna
   `capturar_desde` em `wgotalent_email_credenciais`. Vazio (padrão): o
   watermark inicial pula para "a partir de agora" (item 4), sem varrer
   nada. Preenchido: o watermark inicial é `0` (varre desde o UID 1), mas o
   próprio `IMAP SEARCH` já filtra por `SINCE <data>` no servidor — nunca
   busca nem processa mensagem anterior à data escolhida. Substitui um
   design anterior (checkbox "processar tudo desde o início", sem limite de
   data) depois que o teste manual mostrou que "tudo" processava mais de
   19 mil mensagens de uma caixa pessoal real; limitar por data é
   necessário para colocar a captação em produção contra uma caixa (Zimbra)
   que já recebe currículos há tempo, sem varrer anos de e-mail não
   relacionado. A data fica salva na credencial e continua sendo enviada em
   todo ciclo seguinte — uma vez que o watermark ultrapassa essa data, o
   filtro `SINCE` vira um no-op permanente e inofensivo, sem precisar de um
   passo explícito de "desativar depois do backfill".
7. **Limite de mensagens por ciclo** (`MAX_MENSAGENS_POR_CICLO = 20` em
   `captura-curriculos.ts`) — aplicado sempre, não só no backfill. Um
   backlog grande é consumido em lotes ao longo de vários ciclos, não tudo
   de uma vez: cada ciclo busca no máximo N mensagens, ordenadas por UID
   crescente, e o watermark avança até a maior UID **efetivamente
   processada** no lote, nunca além — se o processo for interrompido no
   meio de um backfill grande, o próximo ciclo retoma do lote seguinte, sem
   reprocessar (e sem gastar cota de IA de novo em) o que já foi
   consumido.
8. **Limite de RPM/RPD/tokens do provedor de IA não é implementado aqui,
   de propósito** — a captação reage a `AgenteQuotaExcedidaError` (já
   existente em `src/lib/agents/gemini-client.ts`, com retry/backoff
   próprio para picos curtos), em vez de calcular limites específicos do
   Gemini dentro do código de e-mail. Quando uma mensagem falha por cota
   excedida, o watermark **não avança por cima dela** — fica pendente para
   nova tentativa num ciclo seguinte, dando tempo da janela de RPM/RPD do
   provedor resetar, em vez de descartar o currículo permanentemente. Essa
   abordagem é agnóstica de provedor por construção: funciona sem mudança
   quando Claude/OpenAI forem adicionados como implementações de
   `~/lib/agents/`, porque reage ao mesmo tipo de erro, não a números fixos
   de um provedor específico. Um limitador de taxa configurável por
   provedor (RPM/RPD/TPM) fica para quando houver múltiplos provedores de
   fato implementados — não faz sentido modelar isso a partir de um único
   provedor real.

## Consequências

- **Positivas:** mudança majoritariamente aditiva — não altera o schema de
  `Candidato`/`Triagem`/`AvaliacaoIA`, nem os Server Actions/formulários
  existentes; reaproveita cifra, `runWithLimit` e a orquestração de IA já
  testados. Corrige de quebra o bug de `origem` do upload em lote.
- **Trade-offs:** introduz o primeiro processo de longa duração da
  aplicação (a app hoje é 100% request-response); um `setInterval` dentro do
  processo único do Next.js não coordena entre múltiplas instâncias caso o
  deploy vire multi-instância no futuro — aceito conscientemente dado que a
  execução "loop dentro do processo" foi decisão explícita, não uma
  limitação descoberta depois. Introduz uma nova superfície de credencial
  sensível (senha da caixa de e-mail), com a mesma disciplina de segurança
  já documentada para `apiKeyCifrada` em [SECURITY.md](../SECURITY.md).
  Testes de desenvolvimento usam uma conta Gmail pessoal (exige "Senha de
  App", já que o Gmail não aceita mais login IMAP com a senha normal da
  conta desde 2022); produção usa a conta Zimbra dedicada — a troca de
  provedor é só configuração (host/porta/usuário/senha), sem nenhum código
  específico de provedor.

## Alternativas

- **Webhook inbound do provedor de e-mail** (quando suportado): mais reativo
  que polling, mas reintroduz uma superfície de webhook público — descartado
  por reproduzir o problema de infraestrutura que motivou o ADR-0007
  (endpoint exposto, acoplamento a um provedor específico).
- **`UNSEEN` em vez de watermark de UID**: descartado — frágil se a mesma
  caixa for lida por um humano (RH) ou outro cliente de e-mail, que marcaria
  mensagens como lidas e as tornaria invisíveis ao poller.
- **Cron externo / route handler acionado de fora**: descartado por decisão
  explícita do usuário em favor do loop interno — mais simples de operar
  sem infraestrutura de agendamento adicional, ao custo de não coordenar
  entre múltiplas instâncias (ver Consequências).
- **Microsoft Graph API em vez de IMAP genérico**: descartado por decisão
  explícita do usuário — IMAP cobre os provedores relevantes (Zimbra,
  Google Workspace, teste com Gmail) sem exigir registro de app/OAuth por
  provedor.
