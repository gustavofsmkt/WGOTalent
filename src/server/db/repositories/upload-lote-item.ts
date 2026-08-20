import { eq, sql, asc, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import {
  uploadLoteItens,
  type UploadLoteItem,
  type NovoUploadLoteItem,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export interface UploadLoteItemStatusUpdate {
  status: UploadLoteItem["status"];
  mensagem?: string | null;
  candidatoId?: string | null;
  errorType?: string | null;
}

export const uploadLoteItemRepository = {
  create: async (
    data: NovoUploadLoteItem,
    dbOrTx: DbOrTx = db,
  ): Promise<UploadLoteItem> => {
    const rows = await dbOrTx.insert(uploadLoteItens).values(data).returning();
    const created = rows[0];
    if (!created) {
      throw new Error("Falha ao criar item de upload em lote.");
    }
    return created;
  },

  updateStatus: async (
    id: string,
    data: UploadLoteItemStatusUpdate,
    dbOrTx: DbOrTx = db,
  ): Promise<UploadLoteItem | null> => {
    const rows = await dbOrTx
      .update(uploadLoteItens)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(uploadLoteItens.id, id))
      .returning();
    return rows[0] ?? null;
  },

  findAtivos: async (dbOrTx: DbOrTx = db): Promise<UploadLoteItem[]> => {
    return notDeleted(dbOrTx.select().from(uploadLoteItens), uploadLoteItens).orderBy(
      asc(uploadLoteItens.createdAt),
    );
  },

  /** Limpa itens já finalizados (sucesso ou erro) — nunca os que ainda estão em andamento. */
  softDeleteFinalizados: async (dbOrTx: DbOrTx = db): Promise<void> => {
    await dbOrTx
      .update(uploadLoteItens)
      .set({ deletedAt: sql`now()` })
      .where(inArray(uploadLoteItens.status, ["sucesso", "erro"]));
  },
};
