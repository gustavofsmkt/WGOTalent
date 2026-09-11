import {
  eq,
  desc,
  asc,
  sql,
  ilike,
  or,
  and,
  isNull,
  gte,
  type SQL,
} from "drizzle-orm";
import { db } from "~/server/db";
import {
  triagens,
  candidatos,
  vagas,
  cargos,
  departamentos,
  avaliacaoIA,
  triagemEtapaEnum,
  triagemResultadoEnum,
  triagemMotivoEnum,
  type CidadeRef,
  type Triagem,
  type NovaTriagem,
  type TriagemCompleta,
  type AvaliacaoIA,
  type NovaAvaliacaoIA,
} from "~/server/db/schema";
import {
  activeCitiesForVaga,
  matchesActiveVagaCity,
  notDeleted,
} from "~/server/db/query-helpers";
import {
  getPaginationOffset,
  type PaginatedResult,
  type PaginationInput,
} from "~/lib/pagination";
import { toOrderBy, type SortState } from "~/lib/sort";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

const avaliacaoAtivaJoin = and(
  eq(triagens.id, avaliacaoIA.triagemId),
  isNull(avaliacaoIA.deletedAt),
);

export interface TriagemFiltros {
  etapa?: (typeof triagemEtapaEnum.enumValues)[number];
  resultado?: (typeof triagemResultadoEnum.enumValues)[number];
  motivo?: (typeof triagemMotivoEnum.enumValues)[number];
  vagaId?: string;
  vagaAtiva?: boolean;
  scoreIaMinimo?: number;
  query?: string;
  sort?: SortState | null;
}

const TRIAGEM_SORT_COLUMNS = {
  candidato: candidatos.nome,
  vaga: cargos.titulo,
  etapa: triagens.etapa,
  resultado: triagens.resultado,
  score: avaliacaoIA.scoreIa,
  createdAt: triagens.createdAt,
} as const;

export const TRIAGEM_SORT_KEYS = Object.keys(
  TRIAGEM_SORT_COLUMNS,
) as (keyof typeof TRIAGEM_SORT_COLUMNS)[];

function buildTriagemOrderBy(sort: SortState | null | undefined): SQL[] {
  if (sort && sort.sort in TRIAGEM_SORT_COLUMNS) {
    const column =
      TRIAGEM_SORT_COLUMNS[sort.sort as keyof typeof TRIAGEM_SORT_COLUMNS];
    return [toOrderBy(column, sort.dir), desc(triagens.id)];
  }
  return [desc(triagens.createdAt), desc(triagens.id)];
}

export interface TriagemListSummary {
  total: number;
  emAndamento: number;
  aprovados: number;
}

export interface TriagemListItem {
  id: string;
  etapa: string;
  resultado: string;
  motivo: string | null;
  createdAt: string;
  updatedAt: string;
  candidato: {
    id: string;
    nome: string;
    email: string | null;
  };
  vaga: {
    id: string;
    cargoTitulo: string;
    departamentoNome: string;
    cidades: CidadeRef[];
  };
  avaliacaoIa: {
    id: string;
    scoreIa: string;
    parecerIa: string;
  } | null;
}

export interface VagaOption {
  id: string;
  status: string;
  cidades: CidadeRef[];
  cargo: {
    titulo: string;
    departamento: {
      nome: string;
    };
  };
}

export interface CandidatoOption {
  id: string;
  nome: string;
  email: string | null;
}

function buildTriagemConditions(
  filtros: TriagemFiltros | undefined,
  dbOrTx: DbOrTx,
): SQL[] {
  const conditions: (SQL | undefined)[] = [];
  if (filtros?.etapa) conditions.push(eq(triagens.etapa, filtros.etapa));
  if (filtros?.resultado) {
    conditions.push(eq(triagens.resultado, filtros.resultado));
  }
  if (filtros?.motivo) conditions.push(eq(triagens.motivo, filtros.motivo));
  if (filtros?.vagaId) conditions.push(eq(triagens.vagaId, filtros.vagaId));
  if (filtros?.vagaAtiva) conditions.push(eq(vagas.status, "aberta"));
  if (filtros?.scoreIaMinimo !== undefined) {
    conditions.push(gte(avaliacaoIA.scoreIa, String(filtros.scoreIaMinimo)));
  }

  const query = filtros?.query?.trim();
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(
      or(
        ilike(candidatos.nome, pattern),
        ilike(candidatos.email, pattern),
        ilike(cargos.titulo, pattern),
        ilike(departamentos.nome, pattern),
        matchesActiveVagaCity(dbOrTx, pattern),
      ),
    );
  }

  return conditions.filter((condition): condition is SQL => Boolean(condition));
}

export const triagemRepository = {
  findAllWithJoins: async (
    filtros?: TriagemFiltros,
    dbOrTx: DbOrTx = db,
  ): Promise<TriagemListItem[]> => {
    const conditions = buildTriagemConditions(filtros, dbOrTx);

    // Uses notDeleted ONLY on triagens. This respects the ADR of soft delete semantics:
    // even if a Vaga or Candidato is soft-deleted, historical Triagens remain intact and their references hydrate correctly.
    const rows = await notDeleted(
      dbOrTx
        .select({
          triagem: triagens,
          candidato: candidatos,
          vaga: vagas,
          vagaCidades: activeCitiesForVaga(dbOrTx),
          cargo: cargos,
          departamento: departamentos,
          avaliacao: avaliacaoIA,
        })
        .from(triagens)
        .innerJoin(candidatos, eq(triagens.candidatoId, candidatos.id))
        .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
        .leftJoin(avaliacaoIA, avaliacaoAtivaJoin),
      triagens,
      ...conditions,
    ).orderBy(desc(triagens.createdAt));

    return rows.map((r) => ({
      id: r.triagem.id,
      etapa: r.triagem.etapa,
      resultado: r.triagem.resultado,
      motivo: r.triagem.motivo,
      createdAt: r.triagem.createdAt,
      updatedAt: r.triagem.updatedAt,
      candidato: {
        id: r.candidato.id,
        nome: r.candidato.nome,
        email: r.candidato.email,
      },
      vaga: {
        id: r.vaga.id,
        cargoTitulo: r.cargo.titulo,
        departamentoNome: r.departamento.nome,
        cidades: r.vagaCidades,
      },
      avaliacaoIa: r.avaliacao
        ? {
            id: r.avaliacao.id,
            scoreIa: r.avaliacao.scoreIa,
            parecerIa: r.avaliacao.parecerIa,
          }
        : null,
    }));
  },

  findPageWithJoins: async (
    filtros: TriagemFiltros,
    pagination: PaginationInput,
    dbOrTx: DbOrTx = db,
  ): Promise<PaginatedResult<TriagemListItem>> => {
    const conditions = buildTriagemConditions(filtros, dbOrTx);
    const [rows, totalRows] = await Promise.all([
      notDeleted(
        dbOrTx
          .select({
            triagem: triagens,
            candidato: candidatos,
            vaga: vagas,
            vagaCidades: activeCitiesForVaga(dbOrTx),
            cargo: cargos,
            departamento: departamentos,
            avaliacao: avaliacaoIA,
          })
          .from(triagens)
          .innerJoin(candidatos, eq(triagens.candidatoId, candidatos.id))
          .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
          .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
          .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
          .leftJoin(avaliacaoIA, avaliacaoAtivaJoin),
        triagens,
        ...conditions,
      )
        .orderBy(...buildTriagemOrderBy(filtros.sort))
        .limit(pagination.pageSize)
        .offset(getPaginationOffset(pagination)),
      notDeleted(
        dbOrTx
          .select({ count: sql<number>`count(*)::int` })
          .from(triagens)
          .innerJoin(candidatos, eq(triagens.candidatoId, candidatos.id))
          .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
          .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
          .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
          .leftJoin(avaliacaoIA, avaliacaoAtivaJoin),
        triagens,
        ...conditions,
      ),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.triagem.id,
        etapa: row.triagem.etapa,
        resultado: row.triagem.resultado,
        motivo: row.triagem.motivo,
        createdAt: row.triagem.createdAt,
        updatedAt: row.triagem.updatedAt,
        candidato: {
          id: row.candidato.id,
          nome: row.candidato.nome,
          email: row.candidato.email,
        },
        vaga: {
          id: row.vaga.id,
          cargoTitulo: row.cargo.titulo,
          departamentoNome: row.departamento.nome,
          cidades: row.vagaCidades,
        },
        avaliacaoIa: row.avaliacao
          ? {
              id: row.avaliacao.id,
              scoreIa: row.avaliacao.scoreIa,
              parecerIa: row.avaliacao.parecerIa,
            }
          : null,
      })),
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  getListSummary: async (
    filtros: TriagemFiltros,
    dbOrTx: DbOrTx = db,
  ): Promise<TriagemListSummary> => {
    const conditions = buildTriagemConditions(filtros, dbOrTx);
    const projection = {
      total: sql<number>`count(*)::int`,
      emAndamento: sql<number>`count(*) filter (where ${triagens.resultado} = 'em_andamento')::int`,
      aprovados: sql<number>`count(*) filter (where ${triagens.resultado} = 'aprovado')::int`,
    };

    let rows: Array<{
      total: number;
      emAndamento: number;
      aprovados: number;
    }>;

    if (filtros.query?.trim()) {
      rows = await notDeleted(
        dbOrTx
          .select(projection)
          .from(triagens)
          .innerJoin(candidatos, eq(triagens.candidatoId, candidatos.id))
          .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
          .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
          .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
          .leftJoin(avaliacaoIA, avaliacaoAtivaJoin),
        triagens,
        ...conditions,
      );
    } else if (filtros.vagaAtiva && filtros.scoreIaMinimo !== undefined) {
      rows = await notDeleted(
        dbOrTx
          .select(projection)
          .from(triagens)
          .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
          .leftJoin(avaliacaoIA, avaliacaoAtivaJoin),
        triagens,
        ...conditions,
      );
    } else if (filtros.vagaAtiva) {
      rows = await notDeleted(
        dbOrTx
          .select(projection)
          .from(triagens)
          .innerJoin(vagas, eq(triagens.vagaId, vagas.id)),
        triagens,
        ...conditions,
      );
    } else if (filtros.scoreIaMinimo !== undefined) {
      rows = await notDeleted(
        dbOrTx
          .select(projection)
          .from(triagens)
          .leftJoin(avaliacaoIA, avaliacaoAtivaJoin),
        triagens,
        ...conditions,
      );
    } else {
      rows = await notDeleted(
        dbOrTx.select(projection).from(triagens),
        triagens,
        ...conditions,
      );
    }

    return {
      total: Number(rows[0]?.total ?? 0),
      emAndamento: Number(rows[0]?.emAndamento ?? 0),
      aprovados: Number(rows[0]?.aprovados ?? 0),
    };
  },

  findByIdWithJoins: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<TriagemCompleta | null> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          triagem: triagens,
          candidato: candidatos,
          vaga: vagas,
          vagaCidades: activeCitiesForVaga(dbOrTx),
          cargo: cargos,
          departamento: departamentos,
          avaliacao: avaliacaoIA,
        })
        .from(triagens)
        .innerJoin(candidatos, eq(triagens.candidatoId, candidatos.id))
        .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
        .leftJoin(avaliacaoIA, avaliacaoAtivaJoin),
      triagens,
      eq(triagens.id, id),
    );

    const r = rows[0];
    if (!r) return null;

    return {
      ...r.triagem,
      candidato: r.candidato,
      vaga: {
        ...r.vaga,
        cidades: r.vagaCidades,
        cargo: {
          ...r.cargo,
          departamento: r.departamento,
        },
      },
      avaliacao_ia: r.avaliacao,
    };
  },

  findActiveVagaOptions: async (dbOrTx: DbOrTx = db): Promise<VagaOption[]> => {
    // Para opções de formulário, mostramos apenas Vagas abertas (não deletadas).
    const rows = await notDeleted(
      dbOrTx
        .select({
          vaga: vagas,
          vagaCidades: activeCitiesForVaga(dbOrTx),
          cargo: cargos,
          departamento: departamentos,
        })
        .from(vagas)
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      vagas,
      eq(vagas.status, "aberta"),
    ).orderBy(asc(cargos.titulo));

    return rows.map((r) => ({
      id: r.vaga.id,
      status: r.vaga.status,
      cidades: r.vagaCidades,
      cargo: {
        titulo: r.cargo.titulo,
        departamento: {
          nome: r.departamento.nome,
        },
      },
    }));
  },

  findActiveCandidatoOptions: async (
    dbOrTx: DbOrTx = db,
  ): Promise<CandidatoOption[]> => {
    // Para opções de formulário, mostramos Candidatos ativos (não deletados).
    const rows = await notDeleted(
      dbOrTx
        .select({
          id: candidatos.id,
          nome: candidatos.nome,
          email: candidatos.email,
        })
        .from(candidatos),
      candidatos,
    ).orderBy(asc(candidatos.nome));

    return rows;
  },

  checkActiveEmAndamento: async (
    candidatoId: string,
    vagaId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<boolean> => {
    // Retorna true se houver uma triagem 'em_andamento' para este candidato nesta vaga
    const rows = await notDeleted(
      dbOrTx.select({ id: triagens.id }).from(triagens),
      triagens,
      eq(triagens.candidatoId, candidatoId),
      eq(triagens.vagaId, vagaId),
      eq(triagens.resultado, "em_andamento"),
    );
    return rows.length > 0;
  },

  create: async (data: NovaTriagem, dbOrTx: DbOrTx = db): Promise<Triagem> => {
    const rows = await dbOrTx.insert(triagens).values(data).returning();
    return rows[0]!;
  },

  update: async (
    id: string,
    data: Partial<NovaTriagem>,
    dbOrTx: DbOrTx = db,
  ): Promise<Triagem | undefined> => {
    const rows = await dbOrTx
      .update(triagens)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(triagens.id, id))
      .returning();
    return rows[0];
  },

  finalizarEmAndamentoComoBancoTalentosPorVaga: async (
    vagaId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<string[]> => {
    const rows = await dbOrTx
      .update(triagens)
      .set({
        etapa: "finalizado",
        resultado: "banco_talentos",
        motivo: null,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(triagens.vagaId, vagaId),
          eq(triagens.resultado, "em_andamento"),
          isNull(triagens.deletedAt),
        ),
      )
      .returning({ candidatoId: triagens.candidatoId });

    return rows.map((row) => row.candidatoId);
  },

  softDelete: async (id: string, dbOrTx: DbOrTx = db): Promise<void> => {
    await dbOrTx
      .update(triagens)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(triagens.id, id));
  },

  findForParComAvaliacao: async (
    candidatoId: string,
    vagaId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<{ triagemId: string; avaliacaoId: string | null } | null> => {
    // Pode haver mais de uma triagem não-deletada para o mesmo par (o índice
    // único é parcial em resultado='em_andamento'), então ordenamos pela mais
    // recente para que um retry resuma sempre na triagem atual, e não em uma
    // arbitrária escolhida pelo Postgres.
    const rows = await notDeleted(
      dbOrTx
        .select({
          triagemId: triagens.id,
          avaliacaoId: avaliacaoIA.id,
        })
        .from(triagens)
        .leftJoin(avaliacaoIA, avaliacaoAtivaJoin),
      triagens,
      eq(triagens.candidatoId, candidatoId),
      eq(triagens.vagaId, vagaId),
    )
      .orderBy(desc(triagens.createdAt), desc(triagens.id))
      .limit(1);
    return rows[0] ?? null;
  },

  /**
   * Confirma que uma triagem específica ainda está ativa (não soft-deleted).
   * Usada no retry do avaliador para não vincular/avaliar uma triagem que foi
   * excluída depois que o processamento fixou o triagemId.
   */
  isAtiva: async (id: string, dbOrTx: DbOrTx = db): Promise<boolean> => {
    const rows = await notDeleted(
      dbOrTx.select({ id: triagens.id }).from(triagens),
      triagens,
      eq(triagens.id, id),
    ).limit(1);
    return rows.length > 0;
  },

  hasAnyActiveForCandidato: async (
    candidatoId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<boolean> => {
    const rows = await notDeleted(
      dbOrTx.select({ id: triagens.id }).from(triagens),
      triagens,
      eq(triagens.candidatoId, candidatoId),
    ).limit(1);
    return rows.length > 0;
  },

  findAvaliacaoAtivaPorTriagemId: async (
    triagemId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<AvaliacaoIA | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(avaliacaoIA),
      avaliacaoIA,
      eq(avaliacaoIA.triagemId, triagemId),
    ).limit(1);
    return rows[0] ?? null;
  },

  /**
   * Triagens ainda na etapa inicial "Currículo" e em andamento — usadas
   * pelo fluxo de mesclagem de candidato duplicado para decidir se deve
   * excluir e reenviar pelo motor de matching quando o cadastro muda.
   * Etapas posteriores (testes, entrevistas, finalizado) já avançaram no
   * processo e não são tocadas.
   */
  findEmCurriculoPorCandidato: async (
    candidatoId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<string[]> => {
    const rows = await notDeleted(
      dbOrTx.select({ id: triagens.id }).from(triagens),
      triagens,
      eq(triagens.candidatoId, candidatoId),
      eq(triagens.etapa, "curriculo"),
      eq(triagens.resultado, "em_andamento"),
    );
    return rows.map((r) => r.id);
  },

  /** AvaliacaoIA não tem CRUD próprio (1:1 de Triagem, sempre inline) — a escrita mora aqui. */
  gravarAvaliacaoIA: async (
    data: NovaAvaliacaoIA,
    dbOrTx: DbOrTx = db,
  ): Promise<AvaliacaoIA> => {
    const rows = await dbOrTx.insert(avaliacaoIA).values(data).returning();
    const created = rows[0];
    if (!created) {
      throw new Error("Falha ao gravar avaliação de IA.");
    }
    return created;
  },
};
