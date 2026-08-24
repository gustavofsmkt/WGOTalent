import { emailCredencialRepository } from "~/server/db/repositories/email-credencial";
import { decryptCredential } from "~/lib/agents/crypto";
import { buscarMensagensNovas, type MensagemComAnexos } from "~/lib/email/imap-client";
import { processarCurriculoRecebido } from "~/server/candidatos/processar-curriculo-recebido";
import { runWithLimit } from "~/lib/concurrency/run-with-limit";

const CONCORRENCIA_CAPTURA_EMAIL = 3;

/**
 * Roda um ciclo de captura de currículos por e-mail: sem credencial ativa,
 * não faz nada. O watermark (`ultimoUidProcessado`) só avança depois que o
 * ciclo termina, para o maior UID visto — nunca parcialmente. Se qualquer
 * etapa lançar antes disso (ex: falha de conexão IMAP), a função retorna
 * sem lançar e o watermark simplesmente não avança: reprocessar o mesmo
 * range no próximo tick é seguro, porque o dedup por e-mail/celular de
 * `processarCurriculoRecebido` já trata isso como merge, não duplicação.
 */
export async function executarCicloDeCaptura(): Promise<void> {
  const credencial = await emailCredencialRepository.findActiva();
  if (!credencial) {
    return;
  }

  let mensagens: MensagemComAnexos[];
  try {
    mensagens = await buscarMensagensNovas({
      host: credencial.host,
      porta: credencial.porta,
      usuario: credencial.usuario,
      senha: decryptCredential(credencial.senhaCifrada),
      pasta: credencial.pasta,
      desdeUid: credencial.ultimoUidProcessado,
    });
  } catch (e) {
    console.error(
      `[captura-curriculos] Falha ao conectar em ${credencial.host}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return;
  }

  if (mensagens.length === 0) {
    return;
  }

  const itens = mensagens.flatMap((mensagem) => mensagem.anexos);

  const resultados = await runWithLimit(itens, CONCORRENCIA_CAPTURA_EMAIL, (anexo) =>
    processarCurriculoRecebido({
      buffer: anexo.buffer,
      filename: anexo.filename,
      mimeType: anexo.mimeType,
      origem: "email",
    }),
  );

  const sucesso = resultados.filter((r) => r.ok && r.value.status === "sucesso").length;
  const erro = resultados.length - sucesso;

  const maiorUid = mensagens.reduce(
    (max, m) => Math.max(max, m.uid),
    credencial.ultimoUidProcessado ?? 0,
  );
  await emailCredencialRepository.atualizarWatermark(credencial.id, maiorUid);

  console.log(
    `[captura-curriculos] ${mensagens.length} mensagens, ${itens.length} anexos elegíveis, ${sucesso} sucesso, ${erro} erro.`,
  );
}
