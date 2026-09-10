import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from "~/lib/validation/candidato-arquivo";

export interface AnexoRecebido {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface MensagemComAnexos {
  uid: number;
  /** Assunto do e-mail, ou `null` quando ausente. */
  assunto: string | null;
  /**
   * Corpo do e-mail em texto puro (`parsed.text`), truncado em
   * `MAX_CORPO_EMAIL` para não guardar mensagens gigantes no banco nem
   * estourar o prompt da extração. `null` quando ausente.
   */
  corpo: string | null;
  anexos: AnexoRecebido[];
}

/**
 * Limite do corpo do e-mail conservado. Corpos longos (threads, assinaturas,
 * disclaimers) não agregam à extração e só inflariam o storage e o prompt.
 */
const MAX_CORPO_EMAIL = 8000;

export interface BuscarMensagensNovasParams {
  host: string;
  porta: number;
  usuario: string;
  senha: string;
  pasta: string;
  /** Último UID já processado, ou `null` se a caixa nunca foi capturada. */
  desdeUid: number | null;
  /**
   * Filtro opcional de data (`YYYY-MM-DD`) aplicado no próprio IMAP SEARCH
   * (`SINCE`) — nunca busca nem processa mensagem anterior a ela. Usado
   * para limitar o backfill inicial a uma janela recente em vez da caixa
   * inteira. Uma vez que o watermark ultrapassa essa data, o filtro vira
   * um no-op inofensivo (toda mensagem nova é posterior a ela por
   * definição), então é seguro continuar passando o mesmo valor sempre.
   */
  capturarDesde?: string | null;
  /**
   * Máximo de mensagens buscadas nesta chamada. Sem limite, um backlog
   * grande (backfill de uma caixa em produção) faria um único ciclo tentar
   * buscar e processar tudo de uma vez — lento, e uma interrupção no meio
   * perderia todo o progresso do ciclo. Com limite, o backlog é consumido
   * em lotes ao longo de vários ciclos, e o watermark avança por lote.
   */
  limiteLote?: number;
}

export interface ResultadoBusca {
  mensagens: MensagemComAnexos[];
  /**
   * Piso seguro para o watermark além do maior UID em `mensagens` — só
   * preenchido quando esta busca cobriu tudo que havia disponível (não foi
   * cortada por `limiteLote`). É o que permite pular todo o histórico na
   * primeira captura (`desdeUid === null`) sem reprocessar a caixa inteira
   * a cada ciclo até a primeira mensagem nova chegar, e o que faz o
   * watermark ficar em dia mesmo com `mensagens` vazio. `null` quando ainda
   * resta mais mensagem além do lote retornado — nesse caso o watermark só
   * pode avançar até a maior UID efetivamente processada, nunca além.
   */
  uidReferencia: number | null;
}

/**
 * Conecta na caixa IMAP configurada e retorna as mensagens novas com seus
 * anexos elegíveis (mimetype/tamanho aceitos para currículo). Na primeira
 * captura (`desdeUid === null`) NÃO varre o histórico da caixa — começa do
 * `uidNext` atual, ou seja, só captura o que chegar dali em diante (a menos
 * que o chamador já tenha inicializado o watermark em 0 para pedir
 * explicitamente o backfill do histórico). Não avança nenhum watermark —
 * isso é responsabilidade do chamador.
 */
export async function buscarMensagensNovas(
  params: BuscarMensagensNovasParams,
): Promise<ResultadoBusca> {
  const client = new ImapFlow({
    host: params.host,
    port: params.porta,
    secure: params.porta === 993,
    auth: { user: params.usuario, pass: params.senha },
    logger: false,
    connectionTimeout: 20000,
    greetingTimeout: 10000,
  });

  await client.connect();

  try {
    const lock = await client.getMailboxLock(params.pasta);
    try {
      const mailbox = client.mailbox;
      const uidNext = mailbox ? mailbox.uidNext : 1;
      const primeiroUid =
        params.desdeUid === null ? uidNext : params.desdeUid + 1;

      // Já processamos tudo que existe na caixa (o maior UID é `uidNext - 1`).
      // Sem este guard, o IMAP dispara um quirk conhecido: num SEARCH `N:*`
      // com `N` acima do maior UID, o `*` resolve para o maior UID e a faixa
      // `N:*` normaliza para `maiorUid:N`, devolvendo SEMPRE a última mensagem
      // da caixa — que seria rebuscada e reprocessada a cada ciclo.
      if (primeiroUid >= uidNext) {
        return { mensagens: [], uidReferencia: uidNext - 1 };
      }

      const encontrados = (
        (await client.search(
          {
            uid: `${primeiroUid}:*`,
            ...(params.capturarDesde ? { since: params.capturarDesde } : {}),
          },
          { uid: true },
        )) || []
      )
        .slice()
        .sort((a, b) => a - b)
        // Defesa extra contra o mesmo quirk `N:*`: descarta qualquer UID que o
        // servidor devolva abaixo do piso pedido.
        .filter((uid) => uid >= primeiroUid);

      if (encontrados.length === 0) {
        return { mensagens: [], uidReferencia: uidNext - 1 };
      }

      const cortado =
        params.limiteLote != null && encontrados.length > params.limiteLote;
      const uids = cortado
        ? encontrados.slice(0, params.limiteLote)
        : encontrados;
      const uidReferencia = cortado ? null : uidNext - 1;

      const mensagens: MensagemComAnexos[] = [];
      for await (const message of client.fetch(
        uids,
        { uid: true, source: true },
        { uid: true },
      )) {
        if (!message.source) continue;

        const parsed = await simpleParser(message.source);
        const anexos: AnexoRecebido[] = parsed.attachments
          .filter(
            (anexo) =>
              ALLOWED_MIME_TYPES.includes(anexo.contentType) &&
              anexo.content.length <= MAX_FILE_SIZE,
          )
          .map((anexo) => ({
            filename: anexo.filename ?? "anexo",
            mimeType: anexo.contentType,
            buffer: anexo.content,
          }));

        const assunto = parsed.subject?.trim() ?? null;
        const corpoBruto = parsed.text?.trim() ?? null;
        const corpo =
          corpoBruto && corpoBruto.length > MAX_CORPO_EMAIL
            ? corpoBruto.slice(0, MAX_CORPO_EMAIL)
            : corpoBruto;

        mensagens.push({
          uid: message.uid,
          assunto: assunto || null,
          corpo: corpo || null,
          anexos,
        });
      }

      return { mensagens, uidReferencia };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }
}
