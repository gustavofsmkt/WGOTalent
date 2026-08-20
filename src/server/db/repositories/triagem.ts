import { eq, desc, asc, type SQL } from "drizzle-orm";
import { db } from "~/server/db";
import {
  triagens,
  candidatos,
  vagas,
  cargos,
  departamentos,
  avaliacaoIA,
  type TriagemCompleta,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export interface TriagemFiltros {
  etapa?: string;
  resultado?: string;
  motivo?: string;
}

export interface TriagemListItem {
  id: string;
  etapa: string;
  resultado: string;
  motivo: string | null;
  parecerRh: string | null;
  parecerRhData: string | null;
  createdAt: string;
  updatedAt: string;
  candidato: {
    id: string;
    nome: string;
    email: string;
  };
  vaga: {
    id: string;
    cargoTitulo: string;
    departamentoNome: string;
    cidade: string;
    uf: string;
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
  cidade: string;
  uf: string;
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
  email: string;
}

export const triagemRepository = {
  findAllWithJoins: async (
    filtros?: TriagemFiltros,
    dbOrTx: DbOrTx = db,
  ): Promise<TriagemListItem[]> => {
    const conditions: (SQL | undefined)[] = [];
    if (filtros?.etapa) conditions.push(eq(triagens.etapa, filtros.etapa as any));
    if (filtros?.resultado) conditions.push(eq(triagens.resultado, filtros.resultado as any));
    if (filtros?.motivo) conditions.push(eq(triagens.motivo, filtros.motivo as any));

    // Uses notDeleted ONLY on triagens. This respects the ADR of soft delete semantics:
    // even if a Vaga or Candidato is soft-deleted, historical Triagens remain intact and their references hydrate correctly.
    const rows = await notDeleted(
      dbOrTx
        .select({
          triagem: triagens,
          candidato: candidatos,
          vaga: vagas,
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
      parecerRh: r.triagem.parecerRh,
      parecerRhData: r.triagem.parecerRhData,
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
        cidade: r.vaga.cidade,
        uf: r.vaga.uf,
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
      cidade: r.vaga.cidade,
      uf: r.vaga.uf,
      cargo: {
        titulo: r.cargo.titulo,
        departamento: {
          nome: r.departamento.nome,
        },
      },
    }));
  },

  findActiveCandidatoOptions: async (dbOrTx: DbOrTx = db): Promise<CandidatoOption[]> => {
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
      dbOrTx
        .select({ id: triagens.id })
        .from(triagens),
      triagens,
      eq(triagens.candidatoId, candidatoId),
      eq(triagens.vagaId, vagaId),
      eq(triagens.resultado, "em_andamento"),
    );
    return rows.length > 0;
  },

  create: async (data: any, dbOrTx: DbOrTx = db): Promise<any> => {
    const rows = await dbOrTx.insert(triagens).values(data).returning();
    return rows[0];
  },

  update: async (id: string, data: any, dbOrTx: DbOrTx = db): Promise<any> => {
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
};
