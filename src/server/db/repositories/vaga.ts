import { eq, and, sql, isNull, asc, desc, gte } from "drizzle-orm";
import { db } from "~/server/db";
import {
  vagas,
  vagaCidades,
  cidades,
  cargos,
  departamentos,
  type Vaga,
  type NovaVaga,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export interface CidadeRef {
  id: string;
  nome: string;
  uf: string;
}

export interface VagaWithCargoAndDepartamento extends Vaga {
  cidades: CidadeRef[];
  cargo: {
    id: string;
    titulo: string;
    ativo: boolean;
    descricao: string;
    requisitos: string;
    requisitosDesejaveis: string;
    criteriosEliminatorios: string;
    departamento: {
      id: string;
      nome: string;
    };
  };
}

export interface CargoOption {
  id: string;
  titulo: string;
  departamento: {
    id: string;
    nome: string;
  };
}

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

function mapRowToVagaWithCargo(r: {
  id: string;
  status: Vaga["status"];
  posicoesDisponiveis: number;
  notaCorte: string;
  cargoId: string;
  remuneracaoOferecida: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  cidades: CidadeRef[];
  cargoIdValue: string;
  cargoTitulo: string;
  cargoAtivo: boolean;
  cargoDescricao: string;
  cargoRequisitos: string;
  cargoRequisitosDesejaveis: string;
  cargoCriteriosEliminatorios: string;
  departamentoIdValue: string;
  departamentoNome: string;
}): VagaWithCargoAndDepartamento {
  return {
    id: r.id,
    status: r.status,
    posicoesDisponiveis: r.posicoesDisponiveis,
    notaCorte: r.notaCorte,
    cargoId: r.cargoId,
    remuneracaoOferecida: r.remuneracaoOferecida,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt,
    cidades: r.cidades,
    cargo: {
      id: r.cargoIdValue,
      titulo: r.cargoTitulo,
      ativo: r.cargoAtivo,
      descricao: r.cargoDescricao,
      requisitos: r.cargoRequisitos,
      requisitosDesejaveis: r.cargoRequisitosDesejaveis,
      criteriosEliminatorios: r.cargoCriteriosEliminatorios,
      departamento: {
        id: r.departamentoIdValue,
        nome: r.departamentoNome,
      },
    },
  };
}

const fullVagaSelect = {
  id: vagas.id,
  status: vagas.status,
  posicoesDisponiveis: vagas.posicoesDisponiveis,
  notaCorte: vagas.notaCorte,
  cargoId: vagas.cargoId,
  remuneracaoOferecida: vagas.remuneracaoOferecida,
  createdAt: vagas.createdAt,
  updatedAt: vagas.updatedAt,
  deletedAt: vagas.deletedAt,
  cidades: cidadesSubquery,
  cargoIdValue: cargos.id,
  cargoTitulo: cargos.titulo,
  cargoAtivo: cargos.ativo,
  cargoDescricao: cargos.descricao,
  cargoRequisitos: cargos.requisitos,
  cargoRequisitosDesejaveis: cargos.requisitosDesejaveis,
  cargoCriteriosEliminatorios: cargos.criteriosEliminatorios,
  departamentoIdValue: departamentos.id,
  departamentoNome: departamentos.nome,
};

export const vagaRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<Vaga[]> => {
    return notDeleted(dbOrTx.select().from(vagas), vagas).orderBy(
      desc(vagas.createdAt),
    );
  },

  findAllWithCargoAndDepartamento: async (
    dbOrTx: DbOrTx = db,
  ): Promise<VagaWithCargoAndDepartamento[]> => {
    const rows = await notDeleted(
      dbOrTx
        .select(fullVagaSelect)
        .from(vagas)
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      vagas,
    ).orderBy(desc(vagas.createdAt));

    return rows.map(mapRowToVagaWithCargo);
  },

  findById: async (id: string, dbOrTx: DbOrTx = db): Promise<Vaga | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(vagas),
      vagas,
      eq(vagas.id, id),
    );
    return rows[0] ?? null;
  },

  findByIdWithCargoAndDepartamento: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<VagaWithCargoAndDepartamento | null> => {
    const rows = await notDeleted(
      dbOrTx
        .select(fullVagaSelect)
        .from(vagas)
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      vagas,
      eq(vagas.id, id),
    );

    const r = rows[0];
    if (!r) return null;
    return mapRowToVagaWithCargo(r);
  },

  findHistoricalByIdWithCargoAndDepartamento: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<VagaWithCargoAndDepartamento | null> => {
    const rows = await dbOrTx
      .select({
        ...fullVagaSelect,
        cargoIdValue: sql<string>`COALESCE(${cargos.id}::text, '')`,
        cargoTitulo: sql<string>`COALESCE(${cargos.titulo}, 'Cargo não identificado')`,
        cargoAtivo: sql<boolean>`COALESCE(${cargos.ativo}, false)`,
        cargoDescricao: sql<string>`COALESCE(${cargos.descricao}, '')`,
        cargoRequisitos: sql<string>`COALESCE(${cargos.requisitos}, '')`,
        cargoRequisitosDesejaveis: sql<string>`COALESCE(${cargos.requisitosDesejaveis}, '')`,
        cargoCriteriosEliminatorios: sql<string>`COALESCE(${cargos.criteriosEliminatorios}, '')`,
        departamentoIdValue: sql<string>`COALESCE(${departamentos.id}::text, '')`,
        departamentoNome: sql<string>`COALESCE(${departamentos.nome}, 'Departamento não identificado')`,
      })
      .from(vagas)
      .leftJoin(cargos, eq(vagas.cargoId, cargos.id))
      .leftJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
      .where(eq(vagas.id, id));

    const r = rows[0];
    if (!r) return null;
    return mapRowToVagaWithCargo(r as Parameters<typeof mapRowToVagaWithCargo>[0]);
  },

  findActiveCargoOptions: async (
    dbOrTx: DbOrTx = db,
  ): Promise<CargoOption[]> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          id: cargos.id,
          titulo: cargos.titulo,
          departamento: {
            id: departamentos.id,
            nome: departamentos.nome,
          },
        })
        .from(cargos)
        .innerJoin(
          departamentos,
          and(
            eq(cargos.departamentoId, departamentos.id),
            isNull(departamentos.deletedAt),
          ),
        ),
      cargos,
      eq(cargos.ativo, true),
    ).orderBy(asc(cargos.titulo));

    return rows;
  },

  /** Finds open vagas that include the given city name (candidato's city). */
  findOpenByCidade: async (
    cidade: string,
    dbOrTx: DbOrTx = db,
  ): Promise<VagaWithCargoAndDepartamento[]> => {
    const rows = await notDeleted(
      dbOrTx
        .select(fullVagaSelect)
        .from(vagas)
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      vagas,
      and(
        eq(vagas.status, "aberta"),
        sql`EXISTS (
          SELECT 1
          FROM wgotalent_vaga_cidades vc
          JOIN wgotalent_cidades c ON c.id = vc.cidade_id AND c.deleted_at IS NULL
          WHERE vc.vaga_id = ${vagas.id} AND vc.deleted_at IS NULL AND c.nome = ${cidade}
        )`,
      ),
    ).orderBy(desc(vagas.createdAt));

    return rows.map(mapRowToVagaWithCargo);
  },

  existsRecentDuplicate: async (
    data: {
      cargoId: string;
      status: string;
      posicoesDisponiveis: number;
      notaCorte: string;
      remuneracaoOferecida?: string | null;
    },
    dbOrTx: DbOrTx = db,
  ): Promise<boolean> => {
    // Guard contra duplo-submit: mesma vaga (campos principais) criada nos últimos 10s.
    const rows = await notDeleted(
      dbOrTx.select({ id: vagas.id }).from(vagas),
      vagas,
      eq(vagas.cargoId, data.cargoId),
      eq(vagas.status, data.status as Vaga["status"]),
      eq(vagas.posicoesDisponiveis, data.posicoesDisponiveis),
      eq(vagas.notaCorte, data.notaCorte),
      data.remuneracaoOferecida
        ? eq(vagas.remuneracaoOferecida, data.remuneracaoOferecida)
        : isNull(vagas.remuneracaoOferecida),
      gte(vagas.createdAt, sql`now() - interval '10 seconds'`),
    ).limit(1);
    return rows.length > 0;
  },

  create: async (
    data: NovaVaga & { cidadeIds: string[] },
    dbOrTx: DbOrTx = db,
  ): Promise<Vaga> => {
    const { cidadeIds, ...vagaData } = data;

    const doCreate = async (tx: DbOrTx) => {
      const rows = await tx.insert(vagas).values(vagaData).returning();
      const created = rows[0];
      if (!created) throw new Error("Falha ao criar vaga.");

      if (cidadeIds.length > 0) {
        await tx
          .insert(vagaCidades)
          .values(cidadeIds.map((cidadeId) => ({ vagaId: created.id, cidadeId })));
      }

      return created;
    };

    if ("transaction" in dbOrTx && typeof dbOrTx.transaction === "function") {
      return (dbOrTx as typeof db).transaction(doCreate);
    }
    return doCreate(dbOrTx);
  },

  update: async (
    id: string,
    data: Partial<NovaVaga> & { cidadeIds?: string[] },
    dbOrTx: DbOrTx = db,
  ): Promise<Vaga | null> => {
    const { cidadeIds, ...vagaData } = data;

    const doUpdate = async (tx: DbOrTx) => {
      const rows = await tx
        .update(vagas)
        .set({ ...vagaData, updatedAt: sql`now()` })
        .where(eq(vagas.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) return null;

      if (cidadeIds !== undefined) {
        await tx
          .update(vagaCidades)
          .set({ deletedAt: sql`now()` })
          .where(and(eq(vagaCidades.vagaId, id), isNull(vagaCidades.deletedAt)));

        if (cidadeIds.length > 0) {
          await tx
            .insert(vagaCidades)
            .values(cidadeIds.map((cidadeId) => ({ vagaId: id, cidadeId })));
        }
      }

      return updated;
    };

    if (cidadeIds !== undefined && "transaction" in dbOrTx && typeof dbOrTx.transaction === "function") {
      return (dbOrTx as typeof db).transaction(doUpdate);
    }
    return doUpdate(dbOrTx);
  },

  softDelete: async (id: string, dbOrTx: DbOrTx = db): Promise<Vaga | null> => {
    const rows = await dbOrTx
      .update(vagas)
      .set({ deletedAt: sql`now()` })
      .where(eq(vagas.id, id))
      .returning();
    return rows[0] ?? null;
  },

  /** Returns the cidade IDs currently linked to a vaga (for pre-populating edit form). */
  findCidadeIdsByVagaId: async (
    vagaId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<string[]> => {
    const rows = await dbOrTx
      .select({ cidadeId: vagaCidades.cidadeId })
      .from(vagaCidades)
      .where(and(eq(vagaCidades.vagaId, vagaId), isNull(vagaCidades.deletedAt)));
    return rows.map((r) => r.cidadeId);
  },
};
