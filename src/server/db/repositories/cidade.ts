import { eq, sql, asc } from "drizzle-orm";
import { db } from "~/server/db";
import { cidades, type Cidade, type NovaCidade } from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export const cidadeRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<Cidade[]> => {
    return notDeleted(dbOrTx.select().from(cidades), cidades).orderBy(
      asc(cidades.uf),
      asc(cidades.nome),
    );
  },

  findById: async (id: string, dbOrTx: DbOrTx = db): Promise<Cidade | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(cidades),
      cidades,
      eq(cidades.id, id),
    );
    return rows[0] ?? null;
  },

  create: async (data: NovaCidade, dbOrTx: DbOrTx = db): Promise<Cidade> => {
    const rows = await dbOrTx.insert(cidades).values(data).returning();
    const created = rows[0];
    if (!created) throw new Error("Falha ao criar cidade.");
    return created;
  },

  softDelete: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<Cidade | null> => {
    const rows = await dbOrTx
      .update(cidades)
      .set({ deletedAt: sql`now()` })
      .where(eq(cidades.id, id))
      .returning();
    return rows[0] ?? null;
  },
};
