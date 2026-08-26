import { env } from "~/env";
import { executarCicloDeCaptura } from "./captura-curriculos";

interface LoopState {
  iniciado: boolean;
  emExecucao: boolean;
}

/**
 * Guarda em `globalThis` (não numa variável de módulo) porque o HMR do
 * `next dev` recarrega este módulo do zero a cada mudança de arquivo — uma
 * variável de módulo perderia o estado e `register()` reiniciaria o loop a
 * cada save, empilhando intervals. `globalThis` sobrevive ao HMR (mesmo
 * padrão usado para cachear a conexão do banco em `~/server/db`).
 */
const globalForEmailCapturaLoop = globalThis as unknown as {
  __wgotalentEmailCapturaLoop: LoopState | undefined;
};

function getState(): LoopState {
  globalForEmailCapturaLoop.__wgotalentEmailCapturaLoop ??= {
    iniciado: false,
    emExecucao: false,
  };
  return globalForEmailCapturaLoop.__wgotalentEmailCapturaLoop;
}

/**
 * Inicia o loop de captura por e-mail. Chamar mais de uma vez (HMR) é
 * seguro — só o primeiro registro cria o `setInterval`. Um tick que dispara
 * enquanto o ciclo anterior ainda não resolveu é pulado, para nunca rodar
 * dois ciclos em paralelo contra a mesma caixa.
 */
export function iniciarLoopDeCaptura(): void {
  const state = getState();
  if (state.iniciado) {
    return;
  }
  state.iniciado = true;

  setInterval(() => {
    if (state.emExecucao) {
      return;
    }
    state.emExecucao = true;
    executarCicloDeCaptura()
      .catch((err) =>
        console.error("[captura-curriculos-loop] Ciclo falhou:", err),
      )
      .finally(() => {
        state.emExecucao = false;
      });
  }, env.EMAIL_CAPTURA_INTERVALO_MS);
}
