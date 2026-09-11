import { and, desc, eq, isNotNull, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "~/server/db";
import {
  candidatos,
  cargos,
  processamentosIa,
  vagas,
  type NovoProcessamentoIa,
  type ProcessamentoIa,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import {
  getPaginationOffset,
  type PaginatedResult,
  type PaginationInput,
} from "~/lib/pagination";
import { toOrderBy, type SortState } from "~/lib/sort";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

type Fluxo = ProcessamentoIa["fluxo"];

const PROCESSAMENTO_SORT_COLUMNS = {
  etapa: processamentosIa.etapa,
  status: processamentosIa.status,
  tentativas: processamentosIa.tentativas,
  iniciadoEm: processamentosIa.iniciadoEm,
  finalizadoEm: processamentosIa.finalizadoEm,
} as const;

export const PROCESSAMENTO_SORT_KEYS = Object.keys(
  PROCESSAMENTO_SORT_COLUMNS,
) as (keyof typeof PROCESSAMENTO_SORT_COLUMNS)[];

function buildProcessamentoOrderBy(sort: SortState | null | undefined): SQL[] {
  if (sort && sort.sort in PROCESSAMENTO_SORT_COLUMNS) {
    const column =
      PROCESSAMENTO_SORT_COLUMNS[
        sort.sort as keyof typeof PROCESSAMENTO_SORT_COLUMNS
      ];
    return [toOrderBy(column, sort.dir), desc(processamentosIa.id)];
  }
  return [desc(processamentosIa.createdAt), desc(processamentosIa.id)];
}

export interface ProcessamentoIaListItem extends ProcessamentoIa {
  candidatoNome: string | null;
  vagaTitulo: string | null;
}

export interface ProcessamentoIaFluxoSummary {
  total: number;
  sucessos: number;
  falhas: number;
  falhasReprocessaveis: number;
}

export interface ProcessamentoIaPageFilters {
  somenteFalhas?: boolean;
  sort?: SortState | null;
}

const MAX_RETRIES_EM_LOTE = 15;

function falhaReprocessavel(fluxo: Fluxo) {
  return and(
    eq(processamentosIa.fluxo, fluxo),
    eq(processamentosIa.status, "falha"),
    fluxo === "ingestao_curriculo"
      ? isNotNull(processamentosIa.arquivoKey)
      : undefined,
  );
}

async function claimRetryById(
  id: string,
  retryPor: string | undefined,
  dbOrTx: DbOrTx,
): Promise<ProcessamentoIa | null> {
  const now = new Date().toISOString();
  const rows = await dbOrTx
    .update(processamentosIa)
    .set({
      status: "processando",
      mensagem: null,
      tentativas: sql`${processamentosIa.tentativas} + 1`,
      retrySolicitadoEm: now,
      retryPor: retryPor ?? null,
      iniciadoEm: now,
      finalizadoEm: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(processamentosIa.id, id),
        eq(processamentosIa.status, "falha"),
        isNull(processamentosIa.deletedAt),
      ),
    )
    .returning();
  return rows[0] ?? null;
}

async function claimLatestFailuresWithDb(
  fluxo: Fluxo,
  limit: number,
  retryPor: string | undefined,
  dbOrTx: DbOrTx,
): Promise<ProcessamentoIa[]> {
  const failures = await notDeleted(
    dbOrTx.select({ id: processamentosIa.id }).from(processamentosIa),
    processamentosIa,
    falhaReprocessavel(fluxo),
  )
    .orderBy(desc(processamentosIa.createdAt), desc(processamentosIa.id))
    .limit(limit);

  const claimed: ProcessamentoIa[] = [];
  for (const failure of failures) {
    const processamento = await claimRetryById(failure.id, retryPor, dbOrTx);
    if (processamento) claimed.push(processamento);
  }
  return claimed;
}

// notDeleted() cobre a tabela principal; os isNull() nos JOINs garantem que um
// candidato/vaga soft-deleted não hidrate nome (a página trata o null).
function withContextSelect(dbOrTx: DbOrTx) {
  return dbOrTx
    .select({
      processamento: processamentosIa,
      candidatoNome: candidatos.nome,
      vagaTitulo: cargos.titulo,
    })
    .from(processamentosIa)
    .leftJoin(
      candidatos,
      and(
        eq(processamentosIa.candidatoId, candidatos.id),
        isNull(candidatos.deletedAt),
      ),
    )
    .leftJoin(
      vagas,
      and(eq(processamentosIa.vagaId, vagas.id), isNull(vagas.deletedAt)),
    )
    .leftJoin(
      cargos,
      and(eq(vagas.cargoId, cargos.id), isNull(cargos.deletedAt)),
    );
}

export const processamentoIaRepository = {
  findPageByFluxo: async (
    fluxo: Fluxo,
    pagination: PaginationInput,
    filters: ProcessamentoIaPageFilters = {},
    dbOrTx: DbOrTx = db,
  ): Promise<PaginatedResult<ProcessamentoIaListItem>> => {
    const listCondition = and(
      eq(processamentosIa.fluxo, fluxo),
      filters.somenteFalhas ? eq(processamentosIa.status, "falha") : undefined,
    );

    const [rows, totalRows] = await Promise.all([
      notDeleted(withContextSelect(dbOrTx), processamentosIa, listCondition)
        .orderBy(...buildProcessamentoOrderBy(filters.sort))
        .limit(pagination.pageSize)
        .offset(getPaginationOffset(pagination)),
      notDeleted(
        dbOrTx
          .select({ count: sql<number>`count(*)::int` })
          .from(processamentosIa),
        processamentosIa,
        listCondition,
      ),
    ]);

    return {
      items: rows.map((row) => ({
        ...row.processamento,
        candidatoNome: row.candidatoNome,
        vagaTitulo: row.vagaTitulo,
      })),
      total: totalRows[0]?.count ?? 0,
    };
  },

  getFluxoSummary: async (
    fluxo: Fluxo,
    dbOrTx: DbOrTx = db,
  ): Promise<ProcessamentoIaFluxoSummary> => {
    const [rows, retryableRows] = await Promise.all([
      notDeleted(
        dbOrTx
          .select({
            total: sql<number>`count(*)::int`,
            sucessos: sql<number>`count(*) filter (where ${processamentosIa.status} = 'sucesso')::int`,
            falhas: sql<number>`count(*) filter (where ${processamentosIa.status} = 'falha')::int`,
          })
          .from(processamentosIa),
        processamentosIa,
        eq(processamentosIa.fluxo, fluxo),
      ),
      notDeleted(
        dbOrTx
          .select({ count: sql<number>`count(*)::int` })
          .from(processamentosIa),
        processamentosIa,
        falhaReprocessavel(fluxo),
      ),
    ]);
    return {
      ...(rows[0] ?? { total: 0, sucessos: 0, falhas: 0 }),
      falhasReprocessaveis: retryableRows[0]?.count ?? 0,
    };
  },

  findById: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<ProcessamentoIa | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(processamentosIa),
      processamentosIa,
      eq(processamentosIa.id, id),
    ).limit(1);
    return rows[0] ?? null;
  },

  create: async (
    data: NovoProcessamentoIa,
    dbOrTx: DbOrTx = db,
  ): Promise<ProcessamentoIa> => {
    const rows = await dbOrTx.insert(processamentosIa).values(data).returning();
    const created = rows[0];
    if (!created) throw new Error("Falha ao registrar processamento de IA.");
    return created;
  },

  finalizar: async (
    id: string,
    data: {
      status: "sucesso" | "falha";
      mensagem: string | null;
      itensPendentes?: string[];
      // undefined = mantém o valor atual; null = limpa a chave do arquivo
      // (falha não reprocessável ou arquivo já apropriado por um candidato).
      arquivoKey?: string | null;
      candidatoId?: string;
    },
    dbOrTx: DbOrTx = db,
  ): Promise<ProcessamentoIa | null> => {
    const now = new Date().toISOString();
    const rows = await dbOrTx
      .update(processamentosIa)
      .set({
        status: data.status,
        mensagem: data.mensagem,
        itensPendentes: data.itensPendentes ?? [],
        ...(data.arquivoKey !== undefined
          ? { arquivoKey: data.arquivoKey }
          : {}),
        ...(data.candidatoId !== undefined
          ? { candidatoId: data.candidatoId }
          : {}),
        finalizadoEm: now,
        updatedAt: now,
      })
      .where(
        and(eq(processamentosIa.id, id), isNull(processamentosIa.deletedAt)),
      )
      .returning();
    return rows[0] ?? null;
  },

  vincularTriagem: async (
    id: string,
    triagemId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<void> => {
    await dbOrTx
      .update(processamentosIa)
      .set({
        triagemId,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(eq(processamentosIa.id, id), isNull(processamentosIa.deletedAt)),
      );
  },

  /**
   * Reserva atômica do retry. Apenas uma chamada consegue trocar a falha para
   * processando; as demais recebem null e não executam o fluxo novamente.
   */
  claimRetry: async (
    id: string,
    retryPor?: string,
    dbOrTx: DbOrTx = db,
  ): Promise<ProcessamentoIa | null> => claimRetryById(id, retryPor, dbOrTx),

  /**
   * Reserva até 15 falhas reprocessáveis mais recentes de um fluxo. Cada
   * reserva continua atômica, então dois cliques simultâneos nunca executam a
   * mesma falha.
   */
  claimLatestFailures: async (
    fluxo: Fluxo,
    limit = MAX_RETRIES_EM_LOTE,
    retryPor?: string,
    dbOrTx: DbOrTx = db,
  ): Promise<ProcessamentoIa[]> => {
    const safeLimit = Math.min(
      Math.max(Math.trunc(limit), 1),
      MAX_RETRIES_EM_LOTE,
    );

    if (dbOrTx === db) {
      return db.transaction((tx) =>
        claimLatestFailuresWithDb(fluxo, safeLimit, retryPor, tx),
      );
    }
    return claimLatestFailuresWithDb(fluxo, safeLimit, retryPor, dbOrTx);
  },
};
