import { emailCredencialRepository } from "~/server/db/repositories/email-credencial";
import { decryptCredential } from "~/lib/agents/crypto";
import { buscarMensagensNovas } from "~/lib/email/imap-client";
import { processarCurriculoRecebido } from "~/server/candidatos/processar-curriculo-recebido";
import { runWithLimit } from "~/lib/concurrency/run-with-limit";

const CONCORRENCIA_CAPTURA_EMAIL = 3;

/**
 * Limite de mensagens buscadas por ciclo. Existe para que um backlog grande
 * (backfill de uma caixa que já recebe currículos há tempo, ver
 * `processarHistorico` no cadastro da credencial) seja consumido em lotes
 * ao longo de vários ciclos, não tudo de uma vez — assim uma interrupção no
 * meio do backfill perde no máximo um lote de progresso, não o backlog
 * inteiro, e nenhum ciclo fica bloqueado por muito tempo processando
 * centenas de mensagens de uma só vez.
 */
const MAX_MENSAGENS_POR_CICLO = 20;

/**
 * Roda um ciclo de captura de currículos por e-mail: sem credencial ativa,
 * não faz nada. O watermark (`ultimoUidProcessado`) avança até o maior UID
 * confirmado como resolvido neste ciclo — ou, quando a busca cobriu tudo
 * que havia disponível (não foi cortada pelo limite de lote) e nenhuma
 * mensagem ficou bloqueada por cota, até `uidReferencia`, mesmo sem
 * mensagem nova nenhuma. É isso que permite pular todo o histórico da caixa
 * na primeira captura sem reprocessá-lo em todo ciclo seguinte, e também
 * consumir um backlog grande em lotes sem nunca avançar o watermark além do
 * que foi realmente resolvido.
 *
 * Uma mensagem cuja extração de IA falhar por limite de cota do provedor
 * (`AgenteQuotaExcedidaError`, agnóstico de provedor — mesmo tratamento
 * para Gemini e OpenAI, e para outros provedores quando forem adicionados) **não** deixa
 * o watermark passar por ela: fica pendente para nova tentativa num ciclo
 * seguinte, depois que a janela de RPM/RPD do provedor tiver tempo de
 * resetar (o intervalo entre ciclos já dá esse respiro). Isso importa
 * sobretudo no backfill inicial de uma caixa grande — sem essa pausa, um
 * estouro de cota no meio do lote descartaria permanentemente os
 * currículos que caíram nesse ponto. Qualquer outra falha (ex: currículo
 * sem e-mail nem celular) não tem motivo para ser tentada de novo, então
 * consome a UID normalmente.
 *
 * Se qualquer etapa lançar antes de calcular o novo watermark (ex: falha de
 * conexão IMAP), a função retorna sem lançar e o watermark simplesmente não
 * avança: reprocessar o mesmo range no próximo tick é seguro, porque o
 * dedup por e-mail/celular de `processarCurriculoRecebido` já trata isso
 * como merge, não duplicação.
 */
export async function executarCicloDeCaptura(): Promise<void> {
  const credencial = await emailCredencialRepository.findActiva();
  if (!credencial) {
    return;
  }

  let resultado: Awaited<ReturnType<typeof buscarMensagensNovas>>;
  try {
    resultado = await buscarMensagensNovas({
      host: credencial.host,
      porta: credencial.porta,
      usuario: credencial.usuario,
      senha: decryptCredential(credencial.senhaCifrada),
      pasta: credencial.pasta,
      desdeUid: credencial.ultimoUidProcessado,
      capturarDesde: credencial.capturarDesde,
      limiteLote: MAX_MENSAGENS_POR_CICLO,
    });
  } catch (e) {
    console.error(
      `[captura-curriculos] Falha ao conectar em ${credencial.host}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return;
  }

  const watermarkAtual = credencial.ultimoUidProcessado ?? 0;
  const pisoWatermark =
    resultado.uidReferencia !== null
      ? Math.max(watermarkAtual, resultado.uidReferencia)
      : watermarkAtual;

  if (resultado.mensagens.length === 0) {
    if (pisoWatermark > watermarkAtual) {
      await emailCredencialRepository.atualizarWatermark(credencial.id, pisoWatermark);
    }
    return;
  }

  const mensagensOrdenadas = resultado.mensagens.slice().sort((a, b) => a.uid - b.uid);
  const itens = mensagensOrdenadas.flatMap((mensagem) =>
    mensagem.anexos.map((anexo) => ({ uid: mensagem.uid, anexo })),
  );

  const processados = await runWithLimit(itens, CONCORRENCIA_CAPTURA_EMAIL, async (item) => ({
    uid: item.uid,
    resultado: await processarCurriculoRecebido({
      buffer: item.anexo.buffer,
      filename: item.anexo.filename,
      mimeType: item.anexo.mimeType,
      origem: "email",
    }),
  }));

  const sucesso = processados.filter((r) => r.ok && r.value.resultado.status === "sucesso").length;
  const erro = processados.length - sucesso;

  const uidsComFalhaDeQuota = new Set<number>();
  for (const r of processados) {
    if (r.ok && r.value.resultado.status === "erro" && r.value.resultado.errorType === "quota") {
      uidsComFalhaDeQuota.add(r.value.uid);
    }
  }

  let maiorUidResolvido = watermarkAtual;
  let bloqueadoPorQuota = false;
  for (const mensagem of mensagensOrdenadas) {
    if (uidsComFalhaDeQuota.has(mensagem.uid)) {
      bloqueadoPorQuota = true;
      break;
    }
    maiorUidResolvido = Math.max(maiorUidResolvido, mensagem.uid);
  }

  const maiorUid = bloqueadoPorQuota ? maiorUidResolvido : Math.max(maiorUidResolvido, pisoWatermark);
  if (maiorUid > watermarkAtual) {
    await emailCredencialRepository.atualizarWatermark(credencial.id, maiorUid);
  }

  if (bloqueadoPorQuota) {
    console.warn(
      "[captura-curriculos] Limite de cota do provedor de IA atingido — pausando a captura neste ponto, retoma no próximo ciclo.",
    );
  }

  console.log(
    `[captura-curriculos] ${resultado.mensagens.length} mensagens, ${itens.length} anexos elegíveis, ${sucesso} sucesso, ${erro} erro.`,
  );
}
