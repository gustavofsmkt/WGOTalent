import { asc, countDistinct, eq, gte, isNull, sql } from "drizzle-orm";
import { unionAll, type PgColumn } from "drizzle-orm/pg-core";
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

export interface VagaMaisAntigaItem {
  vagaId: string;
  cargoTitulo: string;
  departamentoNome: string;
  cidades: CidadeRef[];
  posicoesDisponiveis: number;
  /** Dias inteiros desde a abertura da vaga. */
  diasAberta: number;
  /** Triagens ativas da vaga ainda com resultado `em_andamento`. */
  triagensEmAndamento: number;
}

/** Etapas do funil que têm data e hora agendadas com o candidato. */
export type AtividadeEtapaKey = Extract<
  TriagemEtapaKey,
  "testes" | "entrevista_rh" | "entrevista_gestor"
>;

export interface ProximaAtividadeItem {
  triagemId: string;
  candidatoId: string;
  candidatoNome: string;
  vagaId: string;
  cargoTitulo: string;
  departamentoNome: string;
  etapa: AtividadeEtapaKey;
  /** Horário de parede combinado com o candidato (`AAAA-MM-DD HH:mm:ss`). */
  dataHora: string;
}

export interface DashboardSummary {
  vagasAbertas: number;
  candidatosAtivos: number;
  triagensEmAndamento: number;
  triagensTotais: number;
  mediaScoreIa: MediaScoreIaResult;
  triagensPorEtapa: TriagensPorEtapaCount;
  triagensPorResultado: TriagensPorResultadoCount;
  vagasMaisAntigas: PaginatedResult<VagaMaisAntigaItem>;
  proximasAtividades: PaginatedResult<ProximaAtividadeItem>;
}

export interface DashboardPagination {
  topVagas: PaginationInput;
  atividade: PaginationInput;
}

/**
 * "Agora" em horário de parede de Brasília. Os agendamentos são `timestamp`
 * sem fuso (o horário combinado com o candidato), então a comparação precisa
 * de uma referência na mesma escala — independente do fuso do servidor.
 */
const AGORA_LOCAL = sql`(now() at time zone 'America/Sao_Paulo')`;

/**
 * Dias inteiros entre a criação da vaga e hoje, contados em datas de Brasília
 * para que o resultado não mude conforme o fuso do servidor.
 */
function diasDesdeAbertura() {
  return sql<number>`(${AGORA_LOCAL}::date - (${vagas.createdAt} at time zone 'America/Sao_Paulo')::date)::int`;
}

/**
 * Um SELECT por coluna de agendamento, projetando etapa + data/hora em um
 * formato comum para o `UNION ALL` que alimenta "Próximas Atividades".
 * Filtra por triagens ativas (`em_andamento`) e compromissos ainda futuros.
 */
function selectAgendamentosDaEtapa(
  dbOrTx: DbOrTx,
  etapa: AtividadeEtapaKey,
  coluna: PgColumn,
) {
  return notDeleted(
    dbOrTx
      .select({
        triagemId: triagens.id,
        candidatoId: triagens.candidatoId,
        vagaId: triagens.vagaId,
        // A etapa é um literal (o SELECT que produz a linha já diz qual é) e a
        // data/hora vem de uma coluna diferente em cada braço do UNION, então
        // ambos precisam de um alias fixo para as três partes casarem.
        etapa: sql<AtividadeEtapaKey>`${sql.raw(`'${etapa}'`)}::text`.as(
          "etapa",
        ),
        dataHora: sql<string>`${coluna}`.as("data_hora"),
      })
      .from(triagens),
    triagens,
    eq(triagens.resultado, "em_andamento"),
    gte(coluna, AGORA_LOCAL),
  );
}

/**
 * Todos os compromissos futuros das triagens ativas em uma única relação
 * (uma linha por etapa agendada). Exportada para que o teste possa inspecionar
 * o SQL gerado.
 */
export function agendamentosSubquery(dbOrTx: DbOrTx) {
  return unionAll(
    selectAgendamentosDaEtapa(dbOrTx, "testes", triagens.agendamentoTestes),
    selectAgendamentosDaEtapa(
      dbOrTx,
      "entrevista_rh",
      triagens.agendamentoEntrevistaRh,
    ),
    selectAgendamentosDaEtapa(
      dbOrTx,
      "entrevista_gestor",
      triagens.agendamentoEntrevistaGestor,
    ),
  ).as("agendamentos");
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
   * Semântica: Vagas abertas há mais tempo (`status = 'aberta'`, não deletadas),
   * da mais antiga para a mais recente, com há quantos dias estão abertas e
   * quantas triagens ainda correm nelas.
   * Evita overfetch: projeta apenas identificadores, título, departamento,
   * localização e as duas agregações.
   */
  getVagasMaisAntigasPage: async (
    pagination: PaginationInput,
    dbOrTx: DbOrTx = db,
  ): Promise<PaginatedResult<VagaMaisAntigaItem>> => {
    const [rows, totalRows] = await Promise.all([
      notDeleted(
        dbOrTx
          .select({
            vagaId: vagas.id,
            cargoTitulo: cargos.titulo,
            departamentoNome: departamentos.nome,
            cidades: activeCitiesForVaga(dbOrTx),
            posicoesDisponiveis: vagas.posicoesDisponiveis,
            diasAberta: diasDesdeAbertura(),
            triagensEmAndamento: sql<number>`count(${triagens.id}) filter (where ${triagens.deletedAt} is null and ${triagens.resultado} = 'em_andamento')::int`,
          })
          .from(vagas)
          .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
          .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
          .leftJoin(triagens, eq(vagas.id, triagens.vagaId)),
        vagas,
        eq(vagas.status, "aberta"),
      )
        .groupBy(
          vagas.id,
          cargos.titulo,
          departamentos.nome,
          vagas.posicoesDisponiveis,
          vagas.createdAt,
        )
        .orderBy(asc(vagas.createdAt), asc(vagas.id))
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
        eq(vagas.status, "aberta"),
      ),
    ]);

    return {
      items: rows.map((row) => ({
        vagaId: row.vagaId,
        cargoTitulo: row.cargoTitulo,
        departamentoNome: row.departamentoNome,
        cidades: row.cidades,
        posicoesDisponiveis: row.posicoesDisponiveis,
        diasAberta: Number(row.diasAberta ?? 0),
        triagensEmAndamento: Number(row.triagensEmAndamento ?? 0),
      })),
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  /**
   * Semântica: Agenda das próximas atividades de triagem — testes e entrevistas
   * com data e hora marcadas, ainda no futuro, de triagens em andamento.
   * Uma triagem pode render até três linhas (uma por etapa agendada).
   * Evita overfetch: projeta apenas candidato, vaga e o horário do compromisso.
   */
  getProximasAtividadesPage: async (
    pagination: PaginationInput,
    dbOrTx: DbOrTx = db,
  ): Promise<PaginatedResult<ProximaAtividadeItem>> => {
    const agendamentos = agendamentosSubquery(dbOrTx);
    const [rows, totalRows] = await Promise.all([
      dbOrTx
        .select({
          triagemId: agendamentos.triagemId,
          candidatoId: candidatos.id,
          candidatoNome: candidatos.nome,
          vagaId: vagas.id,
          cargoTitulo: cargos.titulo,
          departamentoNome: departamentos.nome,
          etapa: agendamentos.etapa,
          dataHora: agendamentos.dataHora,
        })
        .from(agendamentos)
        .innerJoin(candidatos, eq(agendamentos.candidatoId, candidatos.id))
        .innerJoin(vagas, eq(agendamentos.vagaId, vagas.id))
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
        .orderBy(
          asc(agendamentos.dataHora),
          asc(candidatos.nome),
          asc(agendamentos.triagemId),
        )
        .limit(pagination.pageSize)
        .offset(getPaginationOffset(pagination)),
      dbOrTx
        .select({ count: sql<number>`count(*)::int` })
        .from(agendamentosSubquery(dbOrTx)),
    ]);

    return {
      items: rows.map((row) => ({
        triagemId: row.triagemId,
        candidatoId: row.candidatoId,
        candidatoNome: row.candidatoNome,
        vagaId: row.vagaId,
        cargoTitulo: row.cargoTitulo,
        departamentoNome: row.departamentoNome,
        etapa: row.etapa,
        dataHora: row.dataHora,
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
      vagasMaisAntigas,
      proximasAtividades,
    ] = await Promise.all([
      dashboardRepository.countVagasAbertas(dbOrTx),
      dashboardRepository.countCandidatosAtivos(dbOrTx),
      dashboardRepository.countTriagensEmAndamento(dbOrTx),
      dashboardRepository.countTriagensTotais(dbOrTx),
      dashboardRepository.getMediaScoreIa(dbOrTx),
      dashboardRepository.getTriagensPorEtapa(dbOrTx),
      dashboardRepository.getTriagensPorResultado(dbOrTx),
      dashboardRepository.getVagasMaisAntigasPage(pagination.topVagas, dbOrTx),
      dashboardRepository.getProximasAtividadesPage(
        pagination.atividade,
        dbOrTx,
      ),
    ]);

    return {
      vagasAbertas,
      candidatosAtivos,
      triagensEmAndamento,
      triagensTotais,
      mediaScoreIa,
      triagensPorEtapa,
      triagensPorResultado,
      vagasMaisAntigas,
      proximasAtividades,
    };
  },
};
