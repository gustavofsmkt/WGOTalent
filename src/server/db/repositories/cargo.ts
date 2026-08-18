import { eq, and, sql, isNull, asc } from "drizzle-orm";
import { db } from "~/server/db";
import {
  cargos,
  departamentos,
  vagas,
  type Cargo,
  type NovoCargo,
  type Vaga,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

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

export const cargoRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<Cargo[]> => {
    return notDeleted(dbOrTx.select().from(cargos), cargos).orderBy(
      asc(cargos.titulo),
    );
  },

  findAllWithDepartamento: async (
    dbOrTx: DbOrTx = db,
  ): Promise<CargoWithDepartamento[]> => {
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
    ).orderBy(asc(cargos.titulo));

    return rows;
  },

  findById: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<Cargo | null> => {
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

  create: async (
    data: NovoCargo,
    dbOrTx: DbOrTx = db,
  ): Promise<Cargo> => {
    const rows = await dbOrTx
      .insert(cargos)
      .values(data)
      .returning();
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

  findActiveVagas: async (
    cargoId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<Vaga[]> => {
    return notDeleted(
      dbOrTx.select().from(vagas),
      vagas,
      eq(vagas.cargoId, cargoId),
    );
  },
};
