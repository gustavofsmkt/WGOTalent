import { eq, desc, asc, sql, type SQL } from "drizzle-orm";
import { db } from "~/server/db";
import {
  triagens,
  candidatos,
  vagas,
  vagaCidades,
  cidades,
  cargos,
  departamentos,
  avaliacaoIA,
  triagemEtapaEnum,
  triagemResultadoEnum,
  triagemMotivoEnum,
  type Triagem,
  type NovaTriagem,
  type TriagemCompleta,
  type AvaliacaoIA,
  type NovaAvaliacaoIA,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import type { CidadeRef } from "~/server/db/repositories/vaga";

/** Correlated subquery that aggregates all active cidades for the current vagas.id row. */
const cidadesSubquery = sql<CidadeRef[]>`
  COALESCE(
    (
      SELECT json_agg(json_build_object('id', c.id::text, 'nome', c.nome, 'uf', c.uf) ORDER BY c.nome)
      FROM wgotalent_vaga_cidades vc
      JOIN wgotalent_cidades c ON c.id = vc.cidade_id AND c.deleted_at IS NULL
      WHERE vc.vaga_id = ${vagas.id} AND vc.deleted_at IS NULL
    ),
    '[]'::json
  )
`;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export interface TriagemFiltros {
  etapa?: (typeof triagemEtapaEnum.enumValues)[number];
  resultado?: (typeof triagemResultadoEnum.enumValues)[number];
  motivo?: (typeof triagemMotivoEnum.enumValues)[number];
  vagaId?: string;
  vagaAtiva?: boolean;
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

export const triagemRepository = {
  findAllWithJoins: async (
    filtros?: TriagemFiltros,
    dbOrTx: DbOrTx = db,
  ): Promise<TriagemListItem[]> => {
    const conditions: (SQL | undefined)[] = [];
    if (filtros?.etapa) conditions.push(eq(triagens.etapa, filtros.etapa));
    if (filtros?.resultado)
      conditions.push(eq(triagens.resultado, filtros.resultado));
    if (filtros?.motivo) conditions.push(eq(triagens.motivo, filtros.motivo));
    if (filtros?.vagaId) conditions.push(eq(triagens.vagaId, filtros.vagaId));
    if (filtros?.vagaAtiva) conditions.push(eq(vagas.status, "aberta"));

    // Uses notDeleted ONLY on triagens. This respects the ADR of soft delete semantics:
    // even if a Vaga or Candidato is soft-deleted, historical Triagens remain intact and their references hydrate correctly.
    const rows = await notDeleted(
      dbOrTx
        .select({
          triagem: triagens,
          candidato: candidatos,
          vaga: vagas,
          vagaCidades: cidadesSubquery,
          cargo: cargos,
          departamento: departamentos,
          avaliacao: avaliacaoIA,
        })
        .from(triagens)
        .innerJoin(candidatos, eq(triagens.candidatoId, candidatos.id))
        .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
        .leftJoin(avaliacaoIA, eq(triagens.id, avaliacaoIA.triagemId)),
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
          vagaCidades: cidadesSubquery,
          cargo: cargos,
          departamento: departamentos,
          avaliacao: avaliacaoIA,
        })
        .from(triagens)
        .innerJoin(candidatos, eq(triagens.candidatoId, candidatos.id))
        .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
        .leftJoin(avaliacaoIA, eq(triagens.id, avaliacaoIA.triagemId)),
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
    // Para opções de formulário, mostramos as Vagas ativas (não deletadas).
    const rows = await notDeleted(
      dbOrTx
        .select({
          vaga: vagas,
          vagaCidades: cidadesSubquery,
          cargo: cargos,
          departamento: departamentos,
        })
        .from(vagas)
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      vagas,
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

  softDelete: async (id: string, dbOrTx: DbOrTx = db): Promise<void> => {
    await dbOrTx
      .update(triagens)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(triagens.id, id));
  },

  /**
   * O índice único triagens_candidato_vaga_idx (schema.ts) agora é parcial
   * por resultado='em_andamento' E deleted_at IS NULL, então uma triagem
   * soft-deleted não ocupa mais a vaga no índice — este check usa
   * notDeleted() para não bloquear a recriação de um par cuja única
   * triagem anterior já foi excluída (ex.: candidato restaurado, ou
   * mesclado com novo dado e reenviado pelo fluxo de triagem).
   */
  existsForPar: async (
    candidatoId: string,
    vagaId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<boolean> => {
    const rows = await notDeleted(
      dbOrTx.select({ id: triagens.id }).from(triagens),
      triagens,
      eq(triagens.candidatoId, candidatoId),
      eq(triagens.vagaId, vagaId),
    ).limit(1);
    return rows.length > 0;
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
