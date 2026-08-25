import { eq, and, desc, sql, gte } from "drizzle-orm";
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

  existsRecentDuplicate: async (
    data: { host: string; porta: number; usuario: string; pasta: string },
    dbOrTx: DbOrTx = db,
  ): Promise<boolean> => {
    // Guard contra duplo-submit: mesma caixa (host+porta+usuario+pasta)
    // cadastrada nos últimos 10s. A senha não entra na comparação (é cifrada
    // com IV aleatório, então duas cifragens da mesma senha nunca são iguais).
    const rows = await notDeleted(
      dbOrTx.select({ id: emailCredenciais.id }).from(emailCredenciais),
      emailCredenciais,
      eq(emailCredenciais.host, data.host),
      eq(emailCredenciais.porta, data.porta),
      eq(emailCredenciais.usuario, data.usuario),
      eq(emailCredenciais.pasta, data.pasta),
      gte(emailCredenciais.createdAt, sql`now() - interval '10 seconds'`),
    ).limit(1);
    return rows.length > 0;
  },

  create: async (
    data: NovaEmailCredencial,
    dbOrTx: DbOrTx = db,
  ): Promise<EmailCredencial> => {
    // Desativar a credencial ativa e inserir a nova precisa ser atômico:
    // dois creates concorrentes fora de uma transação podiam terminar com
    // duas linhas ativo=true simultâneas (dois pollers IMAP na mesma caixa).
    return dbOrTx.transaction(async (tx) => {
      await tx
        .update(emailCredenciais)
        .set({ ativo: false, updatedAt: sql`now()` })
        .where(eq(emailCredenciais.ativo, true));

      const rows = await tx.insert(emailCredenciais).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Falha ao criar credencial de e-mail.");
      }
      return created;
    });
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
