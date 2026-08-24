import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "~/lib/validation/candidato-arquivo";

export interface AnexoRecebido {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface MensagemComAnexos {
  uid: number;
  anexos: AnexoRecebido[];
}

export interface BuscarMensagensNovasParams {
  host: string;
  porta: number;
  usuario: string;
  senha: string;
  pasta: string;
  /** Último UID já processado, ou `null` se a caixa nunca foi capturada (processa desde o início). */
  desdeUid: number | null;
}

/**
 * Conecta na caixa IMAP configurada e retorna as mensagens novas (UID maior
 * que `desdeUid`) com seus anexos elegíveis (mimetype/tamanho aceitos para
 * currículo). Não avança nenhum watermark — isso é responsabilidade do
 * chamador, depois que o ciclo de captura processar o resultado.
 */
export async function buscarMensagensNovas(
  params: BuscarMensagensNovasParams,
): Promise<MensagemComAnexos[]> {
  const client = new ImapFlow({
    host: params.host,
    port: params.porta,
    secure: params.porta === 993,
    auth: { user: params.usuario, pass: params.senha },
    logger: false,
  });

  await client.connect();

  try {
    const lock = await client.getMailboxLock(params.pasta);
    try {
      const primeiroUid = (params.desdeUid ?? 0) + 1;
      const uids = await client.search({ uid: `${primeiroUid}:*` }, { uid: true });

      if (!uids || uids.length === 0) {
        return [];
      }

      const mensagens: MensagemComAnexos[] = [];
      for await (const message of client.fetch(uids, { uid: true, source: true }, { uid: true })) {
        if (!message.source) continue;

        const parsed = await simpleParser(message.source);
        const anexos: AnexoRecebido[] = parsed.attachments
          .filter(
            (anexo) =>
              ALLOWED_MIME_TYPES.includes(anexo.contentType) && anexo.content.length <= MAX_FILE_SIZE,
          )
          .map((anexo) => ({
            filename: anexo.filename ?? "anexo",
            mimeType: anexo.contentType,
            buffer: anexo.content,
          }));

        mensagens.push({ uid: message.uid, anexos });
      }

      return mensagens;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }
}
