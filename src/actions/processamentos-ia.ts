"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAuthenticatedUser } from "~/lib/auth/dal";
import type { ActionState } from "~/lib/action-utils";
import { runWithLimit } from "~/lib/concurrency/run-with-limit";
import { uuidSchema } from "~/lib/validation/common";
import { processamentoIaFluxoSchema } from "~/lib/validation/processamento-ia";
import { reprocessarProcessamentoIa } from "~/server/agents/orquestracao";
import { reprocessarIngestaoCurriculo } from "~/server/candidatos/processar-curriculo-recebido";
import { processamentoIaRepository } from "~/server/db/repositories/processamento-ia";
import type { ProcessamentoIa } from "~/server/db/schema";

const MAX_RETRIES_POR_CLIQUE = 15;
const CONCORRENCIA_RETRIES = 3;

async function executarRetry(processamento: ProcessamentoIa): Promise<void> {
  try {
    if (processamento.fluxo === "ingestao_curriculo") {
      await reprocessarIngestaoCurriculo(processamento);
    } else {
      await reprocessarProcessamentoIa(processamento);
    }
  } catch {
    await processamentoIaRepository
      .finalizar(processamento.id, {
        status: "falha",
        mensagem: "A nova tentativa foi interrompida inesperadamente.",
      })
      .catch(() => undefined);
    console.error("[executarRetry] Falha inesperada no retry de IA.");
  }
}

function agendarRetries(processamentos: ProcessamentoIa[]): void {
  after(async () => {
    await runWithLimit(processamentos, CONCORRENCIA_RETRIES, executarRetry);
    revalidatePath("/processamentos-ia");
  });
}

export async function retryProcessamentoIa(
  id: unknown,
): Promise<ActionState<ProcessamentoIa>> {
  const currentUser = await requireAuthenticatedUser();
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, message: "Processamento inválido." };
  }

  let claimed: ProcessamentoIa | null = null;

  try {
    claimed = await processamentoIaRepository.claimRetry(
      parsed.data,
      currentUser.username,
    );
    if (!claimed) {
      const atual = await processamentoIaRepository.findById(parsed.data);
      if (!atual) {
        return { success: false, message: "Processamento não encontrado." };
      }
      if (atual.status === "processando") {
        return {
          success: false,
          message: "Este processamento já está em andamento.",
        };
      }
      return {
        success: false,
        message:
          "Somente processamentos com falha podem ser tentados novamente.",
      };
    }
    agendarRetries([claimed]);
    revalidatePath("/processamentos-ia");

    return {
      success: true,
      data: claimed,
      message: "Nova tentativa iniciada em segundo plano.",
    };
  } catch {
    if (claimed) {
      await processamentoIaRepository
        .finalizar(claimed.id, {
          status: "falha",
          mensagem: "Não foi possível iniciar a nova tentativa.",
        })
        .catch(() => undefined);
    }
    console.error("[retryProcessamentoIa] Falha inesperada no retry.");
    revalidatePath("/processamentos-ia");
    return {
      success: false,
      message: "Não foi possível tentar novamente. Verifique o histórico.",
    };
  }
}

export async function retryUltimasFalhasIa(
  fluxo: unknown,
): Promise<ActionState<{ agendados: number }>> {
  const currentUser = await requireAuthenticatedUser();
  const parsed = processamentoIaFluxoSchema.safeParse(fluxo);
  if (!parsed.success) {
    return { success: false, message: "Fluxo de IA inválido." };
  }

  let claimed: ProcessamentoIa[] = [];

  try {
    claimed = await processamentoIaRepository.claimLatestFailures(
      parsed.data,
      MAX_RETRIES_POR_CLIQUE,
      currentUser.username,
    );

    if (claimed.length === 0) {
      return {
        success: false,
        data: { agendados: 0 },
        message: "Não há falhas disponíveis para tentar novamente neste fluxo.",
      };
    }

    agendarRetries(claimed);
    revalidatePath("/processamentos-ia");

    return {
      success: true,
      data: { agendados: claimed.length },
      message: `${claimed.length} ${claimed.length === 1 ? "falha foi agendada" : "falhas foram agendadas"} para nova tentativa.`,
    };
  } catch {
    await Promise.all(
      claimed.map((processamento) =>
        processamentoIaRepository
          .finalizar(processamento.id, {
            status: "falha",
            mensagem: "Não foi possível iniciar a nova tentativa.",
          })
          .catch(() => undefined),
      ),
    );
    console.error("[retryUltimasFalhasIa] Falha ao agendar retries de IA.");
    revalidatePath("/processamentos-ia");
    return {
      success: false,
      message: "Não foi possível iniciar as novas tentativas.",
    };
  }
}
