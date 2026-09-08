import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { usuarios, type NovoUsuario, type Usuario } from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export type UsuarioSummary = Pick<
  Usuario,
  "id" | "username" | "createdAt" | "updatedAt"
>;
export type UsuarioSessionSummary = UsuarioSummary &
  Pick<Usuario, "passwordVersion">;

const usuarioSummarySelection = {
  id: usuarios.id,
  username: usuarios.username,
  createdAt: usuarios.createdAt,
  updatedAt: usuarios.updatedAt,
};

const usuarioSessionSummarySelection = {
  ...usuarioSummarySelection,
  passwordVersion: usuarios.passwordVersion,
};

export const usuarioRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<UsuarioSummary[]> => {
    return notDeleted(
      dbOrTx.select(usuarioSummarySelection).from(usuarios),
      usuarios,
    ).orderBy(asc(usuarios.username));
  },

  findById: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<Usuario | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(usuarios),
      usuarios,
      eq(usuarios.id, id),
    ).limit(1);
    return rows[0] ?? null;
  },

  findByUsername: async (
    username: string,
    dbOrTx: DbOrTx = db,
  ): Promise<Usuario | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(usuarios),
      usuarios,
      eq(usuarios.username, username),
    ).limit(1);
    return rows[0] ?? null;
  },

  create: async (
    data: NovoUsuario,
    dbOrTx: DbOrTx = db,
  ): Promise<UsuarioSummary> => {
    const rows = await dbOrTx
      .insert(usuarios)
      .values(data)
      .returning(usuarioSummarySelection);
    const created = rows[0];
    if (!created) throw new Error("Falha ao criar usuário.");
    return created;
  },

  updatePassword: async (
    id: string,
    passwordHash: string,
    dbOrTx: DbOrTx = db,
  ): Promise<UsuarioSessionSummary | null> => {
    const rows = await dbOrTx
      .update(usuarios)
      .set({
        passwordHash,
        passwordVersion: sql`${usuarios.passwordVersion} + 1`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(usuarios.id, id), isNull(usuarios.deletedAt)))
      .returning(usuarioSessionSummarySelection);
    return rows[0] ?? null;
  },
};
