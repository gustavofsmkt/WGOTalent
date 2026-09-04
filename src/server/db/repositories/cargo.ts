import { eq, sql, asc, desc, gte, ilike, or } from "drizzle-orm";
import { db } from "~/server/db";
import {
  cargos,
  departamentos,
  vagas,
  type CidadeRef,
  type Cargo,
  type NovoCargo,
  type Vaga,
} from "~/server/db/schema";
import { activeCitiesForVaga, notDeleted } from "~/server/db/query-helpers";
import {
  getPaginationOffset,
  type PaginatedResult,
  type PaginationInput,
} from "~/lib/pagination";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export interface CargoWithDepartamento extends Cargo {
  departamento: {
    id: string;
    nome: string;
  };
}

export interface DepartamentoOption {
  id: string;
  nome: string;
}

export interface CargoListFilters {
  query?: string;
}

export type VagaComCidades = Vaga & { cidades: CidadeRef[] };

export const cargoRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<Cargo[]> => {
    return notDeleted(dbOrTx.select().from(cargos), cargos).orderBy(
      asc(cargos.titulo),
    );
  },

  findPageWithDepartamento: async (
    filters: CargoListFilters,
    pagination: PaginationInput,
    dbOrTx: DbOrTx = db,
  ): Promise<PaginatedResult<CargoWithDepartamento>> => {
    const pattern = filters.query?.trim()
      ? `%${filters.query.trim()}%`
      : undefined;
    const searchCondition = pattern
      ? or(ilike(cargos.titulo, pattern), ilike(departamentos.nome, pattern))
      : undefined;

    const baseSelect = {
      id: cargos.id,
      departamentoId: cargos.departamentoId,
      titulo: cargos.titulo,
      descricao: cargos.descricao,
      ativo: cargos.ativo,
      faixaSalarial: cargos.faixaSalarial,
      requisitos: cargos.requisitos,
      requisitosDesejaveis: cargos.requisitosDesejaveis,
      criteriosEliminatorios: cargos.criteriosEliminatorios,
      createdAt: cargos.createdAt,
      updatedAt: cargos.updatedAt,
      deletedAt: cargos.deletedAt,
      departamento: {
        id: departamentos.id,
        nome: departamentos.nome,
      },
    };

    const [items, totalRows] = await Promise.all([
      notDeleted(
        dbOrTx
          .select(baseSelect)
          .from(cargos)
          .innerJoin(
            departamentos,
            eq(cargos.departamentoId, departamentos.id),
          ),
        cargos,
        searchCondition,
      )
        .orderBy(asc(cargos.titulo), asc(cargos.id))
        .limit(pagination.pageSize)
        .offset(getPaginationOffset(pagination)),
      notDeleted(
        dbOrTx
          .select({ count: sql<number>`count(*)::int` })
          .from(cargos)
          .innerJoin(
            departamentos,
            eq(cargos.departamentoId, departamentos.id),
          ),
        cargos,
        searchCondition,
      ),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  findById: async (id: string, dbOrTx: DbOrTx = db): Promise<Cargo | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(cargos),
      cargos,
      eq(cargos.id, id),
    );
    return rows[0] ?? null;
  },

  findByIdWithDepartamento: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<CargoWithDepartamento | null> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          id: cargos.id,
          departamentoId: cargos.departamentoId,
          titulo: cargos.titulo,
          descricao: cargos.descricao,
          ativo: cargos.ativo,
          faixaSalarial: cargos.faixaSalarial,
          requisitos: cargos.requisitos,
          requisitosDesejaveis: cargos.requisitosDesejaveis,
          criteriosEliminatorios: cargos.criteriosEliminatorios,
          createdAt: cargos.createdAt,
          updatedAt: cargos.updatedAt,
          deletedAt: cargos.deletedAt,
          departamento: {
            id: departamentos.id,
            nome: departamentos.nome,
          },
        })
        .from(cargos)
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      cargos,
      eq(cargos.id, id),
    );
    return rows[0] ?? null;
  },

  findActiveDepartamentoOptions: async (
    dbOrTx: DbOrTx = db,
  ): Promise<DepartamentoOption[]> => {
    return notDeleted(
      dbOrTx
        .select({
          id: departamentos.id,
          nome: departamentos.nome,
        })
        .from(departamentos),
      departamentos,
    ).orderBy(asc(departamentos.nome));
  },

  existsRecentDuplicate: async (
    data: { departamentoId: string; titulo: string },
    dbOrTx: DbOrTx = db,
  ): Promise<boolean> => {
    // Guard contra duplo-submit: mesmo departamento + título criado nos últimos 10s.
    const rows = await notDeleted(
      dbOrTx.select({ id: cargos.id }).from(cargos),
      cargos,
      eq(cargos.departamentoId, data.departamentoId),
      eq(cargos.titulo, data.titulo),
      gte(cargos.createdAt, sql`now() - interval '10 seconds'`),
    ).limit(1);
    return rows.length > 0;
  },

  create: async (data: NovoCargo, dbOrTx: DbOrTx = db): Promise<Cargo> => {
    const rows = await dbOrTx.insert(cargos).values(data).returning();
    const created = rows[0];
    if (!created) {
      throw new Error("Falha ao criar cargo.");
    }
    return created;
  },

  update: async (
    id: string,
    data: Partial<NovoCargo>,
    dbOrTx: DbOrTx = db,
  ): Promise<Cargo | null> => {
    const rows = await dbOrTx
      .update(cargos)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(cargos.id, id))
      .returning();
    return rows[0] ?? null;
  },

  softDelete: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<Cargo | null> => {
    const rows = await dbOrTx
      .update(cargos)
      .set({ deletedAt: sql`now()` })
      .where(eq(cargos.id, id))
      .returning();
    return rows[0] ?? null;
  },

  hasActiveVagas: async (
    cargoId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<boolean> => {
    const rows = await notDeleted(
      dbOrTx.select({ id: vagas.id }).from(vagas),
      vagas,
      eq(vagas.cargoId, cargoId),
    ).limit(1);
    return rows.length > 0;
  },

  countActiveVagas: async (
    cargoId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<number> => {
    const rows = await notDeleted(
      dbOrTx.select({ count: sql<number>`count(*)::int` }).from(vagas),
      vagas,
      eq(vagas.cargoId, cargoId),
    );
    return Number(rows[0]?.count ?? 0);
  },

  findActiveVagasPage: async (
    cargoId: string,
    pagination: PaginationInput,
    dbOrTx: DbOrTx = db,
  ): Promise<PaginatedResult<VagaComCidades>> => {
    const [items, totalRows] = await Promise.all([
      notDeleted(
        dbOrTx
          .select({
            id: vagas.id,
            cargoId: vagas.cargoId,
            status: vagas.status,
            posicoesDisponiveis: vagas.posicoesDisponiveis,
            notaCorte: vagas.notaCorte,
            remuneracaoOferecida: vagas.remuneracaoOferecida,
            createdAt: vagas.createdAt,
            updatedAt: vagas.updatedAt,
            deletedAt: vagas.deletedAt,
            cidades: activeCitiesForVaga(dbOrTx),
          })
          .from(vagas),
        vagas,
        eq(vagas.cargoId, cargoId),
      )
        .orderBy(desc(vagas.createdAt), desc(vagas.id))
        .limit(pagination.pageSize)
        .offset(getPaginationOffset(pagination)),
      notDeleted(
        dbOrTx.select({ count: sql<number>`count(*)::int` }).from(vagas),
        vagas,
        eq(vagas.cargoId, cargoId),
      ),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },
};
