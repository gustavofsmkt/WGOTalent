import { eq, asc, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  agenteConfig,
  type AgenteConfig,
  type NovoAgenteConfig,
} from "~/server/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export const agenteConfigRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<AgenteConfig[]> => {
    return dbOrTx.select().from(agenteConfig).orderBy(asc(agenteConfig.slot));
  },

  findBySlot: async (
    slot: AgenteConfig["slot"],
    dbOrTx: DbOrTx = db,
  ): Promise<AgenteConfig | null> => {
    const rows = await dbOrTx
      .select()
      .from(agenteConfig)
      .where(eq(agenteConfig.slot, slot));
    return rows[0] ?? null;
  },

  update: async (
    slot: AgenteConfig["slot"],
    data: Partial<Omit<NovoAgenteConfig, "id" | "slot">>,
    dbOrTx: DbOrTx = db,
  ): Promise<AgenteConfig | null> => {
    const rows = await dbOrTx
      .update(agenteConfig)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(agenteConfig.slot, slot))
      .returning();
    return rows[0] ?? null;
  },
};
