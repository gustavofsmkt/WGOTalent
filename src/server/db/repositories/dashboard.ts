import { and, countDistinct, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  vagas,
  candidatos,
  triagens,
  avaliacaoIA,
  cargos,
  departamentos,
  triagemEtapaEnum,
  triagemResultadoEnum,
  type CidadeRef,
} from "~/server/db/schema";
import { activeCitiesForVaga, notDeleted } from "~/server/db/query-helpers";
import {
  DASHBOARD_PAGE_SIZE,
  getPaginationOffset,
  type PaginatedResult,
  type PaginationInput,
} from "~/lib/pagination";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export type TriagemEtapaKey = (typeof triagemEtapaEnum.enumValues)[number];
export type TriagemResultadoKey =
  (typeof triagemResultadoEnum.enumValues)[number];

export type TriagensPorEtapaCount = Record<TriagemEtapaKey, number>;
export type TriagensPorResultadoCount = Record<TriagemResultadoKey, number>;

export interface MediaScoreIaResult {
  /**
   * Média aritmética do score da IA arredondada para 1 casa decimal,
   * ou null quando não houver avaliações registradas.
   */
  media: number | null;
  /**
   * Quantidade total de avaliações de IA não deletadas consideradas no cálculo.
   */
  totalAvaliadas: number;
}

export interface VagaComMaisCandidatosItem {
  vagaId: string;
  cargoTitulo: string;
  departamentoNome: string;
  cidades: CidadeRef[];
  posicoesDisponiveis: number;
  totalCandidatos: number;
}

export interface AtividadeRecenteItem {
  id: string;
  candidatoId: string;
  candidatoNome: string;
  vagaId: string;
  cargoTitulo: string;
  departamentoNome: string;
  etapa: TriagemEtapaKey;
  resultado: TriagemResultadoKey;
  motivo: string | null;
  scoreIa: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  vagasAbertas: number;
  candidatosAtivos: number;
  triagensEmAndamento: number;
  triagensTotais: number;
  mediaScoreIa: MediaScoreIaResult;
  triagensPorEtapa: TriagensPorEtapaCount;
  triagensPorResultado: TriagensPorResultadoCount;
  vagasComMaisCandidatos: PaginatedResult<VagaComMaisCandidatosItem>;
  atividadeRecente: PaginatedResult<AtividadeRecenteItem>;
}

export interface DashboardPagination {
  topVagas: PaginationInput;
  atividade: PaginationInput;
}

export const dashboardRepository = {
  /**
   * Semântica: Contagem de vagas abertas (`status = 'aberta'`) que não sofreram soft delete.
   * Evita overfetch: computa a agregação diretamente no banco e retorna um inteiro escalar.
   */
  countVagasAbertas: async (dbOrTx: DbOrTx = db): Promise<number> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(vagas),
      vagas,
      eq(vagas.status, "aberta"),
    );

    return Number(rows[0]?.count ?? 0);
  },

  /**
   * Semântica: Contagem de candidatos ativos no banco de talentos (não deletados logicamente).
   * Evita overfetch: computa a agregação diretamente no banco e retorna um inteiro escalar.
   */
  countCandidatosAtivos: async (dbOrTx: DbOrTx = db): Promise<number> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(candidatos),
      candidatos,
    );

    return Number(rows[0]?.count ?? 0);
  },

  /**
   * Semântica: Contagem de triagens em andamento (`resultado = 'em_andamento'`) não deletadas.
   * Evita overfetch: computa a agregação diretamente no banco e retorna um inteiro escalar.
   */
  countTriagensEmAndamento: async (dbOrTx: DbOrTx = db): Promise<number> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(triagens),
      triagens,
      eq(triagens.resultado, "em_andamento"),
    );

    return Number(rows[0]?.count ?? 0);
  },

  /**
   * Semântica: Contagem do total geral de triagens históricas não deletadas no sistema.
   * Evita overfetch: computa a agregação diretamente no banco e retorna um inteiro escalar.
   */
  countTriagensTotais: async (dbOrTx: DbOrTx = db): Promise<number> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(triagens),
      triagens,
    );

    return Number(rows[0]?.count ?? 0);
  },

  /**
   * Semântica: Distribuição quantitativa de triagens ativas agrupadas por etapa do funil
   * (`curriculo`, `testes`, `entrevista_rh`, `entrevista_gestor`, `finalizado`).
   * Garante retorno de todas as chaves do enum inicializadas em 0 caso não haja registros.
   */
  getTriagensPorEtapa: async (
    dbOrTx: DbOrTx = db,
  ): Promise<TriagensPorEtapaCount> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          etapa: triagens.etapa,
          count: sql<number>`count(*)::int`,
        })
        .from(triagens),
      triagens,
    ).groupBy(triagens.etapa);

    const counts: TriagensPorEtapaCount = {
      curriculo: 0,
      testes: 0,
      entrevista_rh: 0,
      entrevista_gestor: 0,
      finalizado: 0,
    };

    for (const row of rows) {
      if (row.etapa in counts) {
        counts[row.etapa as TriagemEtapaKey] = Number(row.count ?? 0);
      }
    }

    return counts;
  },

  /**
   * Semântica: Distribuição quantitativa de triagens ativas agrupadas por status de resultado
   * (`em_andamento`, `aprovado`, `reprovado`, `desistente`, `banco_talentos`).
   * Garante inclusão de todos os 5 valores do enum (incluindo `desistente`).
   */
  getTriagensPorResultado: async (
    dbOrTx: DbOrTx = db,
  ): Promise<TriagensPorResultadoCount> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          resultado: triagens.resultado,
          count: sql<number>`count(*)::int`,
        })
        .from(triagens),
      triagens,
    ).groupBy(triagens.resultado);

    const counts: TriagensPorResultadoCount = {
      em_andamento: 0,
      aprovado: 0,
      reprovado: 0,
      desistente: 0,
      banco_talentos: 0,
    };

    for (const row of rows) {
      if (row.resultado in counts) {
        counts[row.resultado as TriagemResultadoKey] = Number(row.count ?? 0);
      }
    }

    return counts;
  },

  /**
   * Semântica: Média aritmética dos scores de IA (`score_ia`) gerados para triagens não deletadas,
   * ignorando avaliações descartadas (`deletedAt IS NULL`).
   * Retorna `media: null` se nenhuma avaliação foi realizada.
   */
  getMediaScoreIa: async (dbOrTx: DbOrTx = db): Promise<MediaScoreIaResult> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          media: sql<
            number | null
          >`round(avg(${avaliacaoIA.scoreIa}::numeric), 1)::float`,
          total: sql<number>`count(*)::int`,
        })
        .from(avaliacaoIA)
        .innerJoin(triagens, eq(avaliacaoIA.triagemId, triagens.id)),
      avaliacaoIA,
      isNull(triagens.deletedAt),
    );

    const first = rows[0];
    const total = Number(first?.total ?? 0);
    const media =
      total > 0 && first?.media !== null && first?.media !== undefined
        ? Number(first.media)
        : null;

    return {
      media,
      totalAvaliadas: total,
    };
  },

  /**
   * Semântica: Ranking de vagas ativas (não deletadas) com maior volume de candidatos/triagens associados.
   * Evita overfetch: projeta apenas identificadores, título, departamento, localização e a contagem agregada.
   */
  getVagasComMaisCandidatosPage: async (
    pagination: PaginationInput,
    dbOrTx: DbOrTx = db,
  ): Promise<PaginatedResult<VagaComMaisCandidatosItem>> => {
    const [rows, totalRows] = await Promise.all([
      notDeleted(
        dbOrTx
          .select({
            vagaId: vagas.id,
            cargoTitulo: cargos.titulo,
            departamentoNome: departamentos.nome,
            cidades: activeCitiesForVaga(dbOrTx),
            posicoesDisponiveis: vagas.posicoesDisponiveis,
            totalCandidatos: sql<number>`count(${triagens.id}) filter (where ${triagens.deletedAt} is null)::int`,
          })
          .from(vagas)
          .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
          .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
          .leftJoin(triagens, eq(vagas.id, triagens.vagaId)),
        vagas,
      )
        .groupBy(
          vagas.id,
          cargos.titulo,
          departamentos.nome,
          vagas.posicoesDisponiveis,
        )
        .orderBy(
          desc(
            sql`count(${triagens.id}) filter (where ${triagens.deletedAt} is null)`,
          ),
          desc(vagas.createdAt),
          desc(vagas.id),
        )
        .limit(pagination.pageSize)
        .offset(getPaginationOffset(pagination)),
      notDeleted(
        dbOrTx
          .select({ count: countDistinct(vagas.id) })
          .from(vagas)
          .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
          .innerJoin(
            departamentos,
            eq(cargos.departamentoId, departamentos.id),
          ),
        vagas,
      ),
    ]);

    return {
      items: rows.map((row) => ({
        vagaId: row.vagaId,
        cargoTitulo: row.cargoTitulo,
        departamentoNome: row.departamentoNome,
        cidades: row.cidades,
        posicoesDisponiveis: row.posicoesDisponiveis,
        totalCandidatos: Number(row.totalCandidatos ?? 0),
      })),
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  /**
   * Semântica: Feed de atividades recentes de triagem (candidaturas, transições de etapa, aprovações, pareceres).
   * Evita overfetch: projeta exclusivamente os dados essenciais para o feed de auditoria/histórico do dashboard.
   */
  getAtividadeRecentePage: async (
    pagination: PaginationInput,
    dbOrTx: DbOrTx = db,
  ): Promise<PaginatedResult<AtividadeRecenteItem>> => {
    const [rows, totalRows] = await Promise.all([
      notDeleted(
        dbOrTx
          .select({
            id: triagens.id,
            candidatoId: candidatos.id,
            candidatoNome: candidatos.nome,
            vagaId: vagas.id,
            cargoTitulo: cargos.titulo,
            departamentoNome: departamentos.nome,
            etapa: triagens.etapa,
            resultado: triagens.resultado,
            motivo: triagens.motivo,
            scoreIa: avaliacaoIA.scoreIa,
            createdAt: triagens.createdAt,
            updatedAt: triagens.updatedAt,
          })
          .from(triagens)
          .innerJoin(candidatos, eq(triagens.candidatoId, candidatos.id))
          .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
          .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
          .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
          .leftJoin(
            avaliacaoIA,
            and(
              eq(triagens.id, avaliacaoIA.triagemId),
              isNull(avaliacaoIA.deletedAt),
            ),
          ),
        triagens,
      )
        .orderBy(
          desc(triagens.updatedAt),
          desc(triagens.createdAt),
          desc(triagens.id),
        )
        .limit(pagination.pageSize)
        .offset(getPaginationOffset(pagination)),
      notDeleted(
        dbOrTx.select({ count: sql<number>`count(*)::int` }).from(triagens),
        triagens,
      ),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        candidatoId: row.candidatoId,
        candidatoNome: row.candidatoNome,
        vagaId: row.vagaId,
        cargoTitulo: row.cargoTitulo,
        departamentoNome: row.departamentoNome,
        etapa: row.etapa,
        resultado: row.resultado,
        motivo: row.motivo,
        scoreIa: row.scoreIa,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  /**
   * Semântica: Agregação unificada de todas as métricas do Dashboard executadas em paralelo.
   */
  getDashboardSummary: async (
    pagination: DashboardPagination = {
      topVagas: { page: 1, pageSize: DASHBOARD_PAGE_SIZE },
      atividade: { page: 1, pageSize: DASHBOARD_PAGE_SIZE },
    },
    dbOrTx: DbOrTx = db,
  ): Promise<DashboardSummary> => {
    const [
      vagasAbertas,
      candidatosAtivos,
      triagensEmAndamento,
      triagensTotais,
      mediaScoreIa,
      triagensPorEtapa,
      triagensPorResultado,
      vagasComMaisCandidatos,
      atividadeRecente,
    ] = await Promise.all([
      dashboardRepository.countVagasAbertas(dbOrTx),
      dashboardRepository.countCandidatosAtivos(dbOrTx),
      dashboardRepository.countTriagensEmAndamento(dbOrTx),
      dashboardRepository.countTriagensTotais(dbOrTx),
      dashboardRepository.getMediaScoreIa(dbOrTx),
      dashboardRepository.getTriagensPorEtapa(dbOrTx),
      dashboardRepository.getTriagensPorResultado(dbOrTx),
      dashboardRepository.getVagasComMaisCandidatosPage(
        pagination.topVagas,
        dbOrTx,
      ),
      dashboardRepository.getAtividadeRecentePage(pagination.atividade, dbOrTx),
    ]);

    return {
      vagasAbertas,
      candidatosAtivos,
      triagensEmAndamento,
      triagensTotais,
      mediaScoreIa,
      triagensPorEtapa,
      triagensPorResultado,
      vagasComMaisCandidatos,
      atividadeRecente,
    };
  },
};
