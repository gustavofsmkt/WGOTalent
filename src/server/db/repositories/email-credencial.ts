import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  emailCredenciais,
  type EmailCredencial,
  type NovaEmailCredencial,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export const emailCredencialRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<EmailCredencial[]> => {
    return notDeleted(
      dbOrTx.select().from(emailCredenciais),
      emailCredenciais,
    ).orderBy(desc(emailCredenciais.createdAt));
  },

  findActiva: async (dbOrTx: DbOrTx = db): Promise<EmailCredencial | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(emailCredenciais),
      emailCredenciais,
      eq(emailCredenciais.ativo, true),
    ).orderBy(desc(emailCredenciais.createdAt));
    return rows[0] ?? null;
  },

  create: async (
    data: NovaEmailCredencial,
    dbOrTx: DbOrTx = db,
  ): Promise<EmailCredencial> => {
    await dbOrTx
      .update(emailCredenciais)
      .set({ ativo: false, updatedAt: sql`now()` })
      .where(eq(emailCredenciais.ativo, true));

    const rows = await dbOrTx.insert(emailCredenciais).values(data).returning();
    const created = rows[0];
    if (!created) {
      throw new Error("Falha ao criar credencial de e-mail.");
    }
    return created;
  },

  deactivate: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<EmailCredencial | null> => {
    const rows = await dbOrTx
      .update(emailCredenciais)
      .set({ ativo: false, updatedAt: sql`now()` })
      .where(and(eq(emailCredenciais.id, id)))
      .returning();
    return rows[0] ?? null;
  },

  findById: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<EmailCredencial | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(emailCredenciais),
      emailCredenciais,
      eq(emailCredenciais.id, id),
    );
    return rows[0] ?? null;
  },

  softDelete: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<EmailCredencial | null> => {
    const rows = await dbOrTx
      .update(emailCredenciais)
      .set({ deletedAt: sql`now()` })
      .where(eq(emailCredenciais.id, id))
      .returning();
    return rows[0] ?? null;
  },

  atualizarWatermark: async (
    id: string,
    uid: number,
    dbOrTx: DbOrTx = db,
  ): Promise<void> => {
    await dbOrTx
      .update(emailCredenciais)
      .set({ ultimoUidProcessado: uid, updatedAt: sql`now()` })
      .where(eq(emailCredenciais.id, id));
  },
};
