import { eq, sql, isNull, asc } from "drizzle-orm";
import { db } from "~/server/db";
import {
  departamentos,
  cargos,
  type Departamento,
  type NovoDepartamento,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export interface DepartamentoWithCargosCount extends Departamento {
  activeCargosCount: number;
}

export const departamentoRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<Departamento[]> => {
    return notDeleted(dbOrTx.select().from(departamentos), departamentos).orderBy(
      asc(departamentos.nome),
    );
  },

  findAllWithActiveCargosCount: async (
    dbOrTx: DbOrTx = db,
  ): Promise<DepartamentoWithCargosCount[]> => {
    const rows = await dbOrTx
      .select({
        id: departamentos.id,
        nome: departamentos.nome,
        descricao: departamentos.descricao,
        createdAt: departamentos.createdAt,
        updatedAt: departamentos.updatedAt,
        deletedAt: departamentos.deletedAt,
        activeCargosCount: sql<number>`count(${cargos.id}) filter (where ${cargos.deletedAt} is null and ${cargos.ativo} = true)::int`,
      })
      .from(departamentos)
      .leftJoin(cargos, eq(cargos.departamentoId, departamentos.id))
      .where(isNull(departamentos.deletedAt))
      .groupBy(departamentos.id)
      .orderBy(asc(departamentos.nome));

    return rows.map((r) => ({
      ...r,
      activeCargosCount: Number(r.activeCargosCount ?? 0),
    }));
  },

  findById: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<Departamento | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(departamentos),
      departamentos,
      eq(departamentos.id, id),
    );
    return rows[0] ?? null;
  },

  create: async (
    data: NovoDepartamento,
    dbOrTx: DbOrTx = db,
  ): Promise<Departamento> => {
    const rows = await dbOrTx
      .insert(departamentos)
      .values(data)
      .returning();
    const created = rows[0];
    if (!created) {
      throw new Error("Falha ao criar departamento.");
    }
    return created;
  },

  update: async (
    id: string,
    data: Partial<NovoDepartamento>,
    dbOrTx: DbOrTx = db,
  ): Promise<Departamento | null> => {
    const rows = await dbOrTx
      .update(departamentos)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(departamentos.id, id))
      .returning();
    return rows[0] ?? null;
  },

  softDelete: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<Departamento | null> => {
    const rows = await dbOrTx
      .update(departamentos)
      .set({ deletedAt: sql`now()` })
      .where(eq(departamentos.id, id))
      .returning();
    return rows[0] ?? null;
  },

  hasActiveCargos: async (
    departamentoId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<boolean> => {
    const rows = await notDeleted(
      dbOrTx.select({ id: cargos.id }).from(cargos),
      cargos,
      eq(cargos.departamentoId, departamentoId),
      eq(cargos.ativo, true),
    ).limit(1);
    return rows.length > 0;
  },

  countActiveCargos: async (
    departamentoId: string,
    dbOrTx: DbOrTx = db,
  ): Promise<number> => {
    const rows = await notDeleted(
      dbOrTx.select({ count: sql<number>`count(*)::int` }).from(cargos),
      cargos,
      eq(cargos.departamentoId, departamentoId),
      eq(cargos.ativo, true),
    );
    return Number(rows[0]?.count ?? 0);
  },
};
