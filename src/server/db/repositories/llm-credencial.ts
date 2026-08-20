import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  llmCredenciais,
  type LlmCredencial,
  type NovaLlmCredencial,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export const llmCredencialRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<LlmCredencial[]> => {
    return notDeleted(
      dbOrTx.select().from(llmCredenciais),
      llmCredenciais,
    ).orderBy(desc(llmCredenciais.createdAt));
  },

  findActiveByProvider: async (
    provider: string,
    dbOrTx: DbOrTx = db,
  ): Promise<LlmCredencial | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(llmCredenciais),
      llmCredenciais,
      eq(llmCredenciais.provider, provider),
      eq(llmCredenciais.ativo, true),
    ).orderBy(desc(llmCredenciais.createdAt));
    return rows[0] ?? null;
  },

  create: async (
    data: NovaLlmCredencial,
    dbOrTx: DbOrTx = db,
  ): Promise<LlmCredencial> => {
    const rows = await dbOrTx.insert(llmCredenciais).values(data).returning();
    const created = rows[0];
    if (!created) {
      throw new Error("Falha ao criar credencial.");
    }
    return created;
  },

  deactivate: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<LlmCredencial | null> => {
    const rows = await dbOrTx
      .update(llmCredenciais)
      .set({ ativo: false, updatedAt: sql`now()` })
      .where(and(eq(llmCredenciais.id, id)))
      .returning();
    return rows[0] ?? null;
  },

  findById: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<LlmCredencial | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(llmCredenciais),
      llmCredenciais,
      eq(llmCredenciais.id, id),
    );
    return rows[0] ?? null;
  },

  softDelete: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<LlmCredencial | null> => {
    const rows = await dbOrTx
      .update(llmCredenciais)
      .set({ deletedAt: sql`now()` })
      .where(eq(llmCredenciais.id, id))
      .returning();
    return rows[0] ?? null;
  },
};
