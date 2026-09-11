import { eq, sql, asc, desc, ilike, or, type SQL } from "drizzle-orm";
import { db } from "~/server/db";
import {
  departamentos,
  cargos,
  type Departamento,
  type NovoDepartamento,
  type Cargo,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import {
  getPaginationOffset,
  type PaginatedResult,
  type PaginationInput,
} from "~/lib/pagination";
import { toOrderBy, type SortState } from "~/lib/sort";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export interface DepartamentoWithCargosCount extends Departamento {
  activeCargosCount: number;
}

export interface DepartamentoListFilters {
  query?: string;
  sort?: SortState | null;
}

const activeCargosCountSql = sql<number>`count(${cargos.id}) filter (where ${cargos.deletedAt} is null and ${cargos.ativo} = true)::int`;

const DEPARTAMENTO_SORT_COLUMNS = {
  nome: departamentos.nome,
  activeCargosCount: activeCargosCountSql,
  createdAt: departamentos.createdAt,
} as const;

export const DEPARTAMENTO_SORT_KEYS = Object.keys(
  DEPARTAMENTO_SORT_COLUMNS,
) as (keyof typeof DEPARTAMENTO_SORT_COLUMNS)[];

function buildDepartamentoOrderBy(sort: SortState | null | undefined): SQL[] {
  if (sort && sort.sort in DEPARTAMENTO_SORT_COLUMNS) {
    const column =
      DEPARTAMENTO_SORT_COLUMNS[
        sort.sort as keyof typeof DEPARTAMENTO_SORT_COLUMNS
      ];
    return [toOrderBy(column, sort.dir), asc(departamentos.id)];
  }
  return [asc(departamentos.nome), asc(departamentos.id)];
}

export const departamentoRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<Departamento[]> => {
    return notDeleted(
      dbOrTx.select().from(departamentos),
      departamentos,
    ).orderBy(asc(departamentos.nome));
  },

  findPageWithActiveCargosCount: async (
    filters: DepartamentoListFilters,
    pagination: PaginationInput,
    dbOrTx: DbOrTx = db,
  ): Promise<PaginatedResult<DepartamentoWithCargosCount>> => {
    const pattern = filters.query?.trim()
      ? `%${filters.query.trim()}%`
      : undefined;
    const searchCondition = pattern
      ? or(
          ilike(departamentos.nome, pattern),
          ilike(departamentos.descricao, pattern),
        )
      : undefined;

    const [rows, totalRows] = await Promise.all([
      notDeleted(
        dbOrTx
          .select({
            id: departamentos.id,
            nome: departamentos.nome,
            descricao: departamentos.descricao,
            createdAt: departamentos.createdAt,
            updatedAt: departamentos.updatedAt,
            deletedAt: departamentos.deletedAt,
            activeCargosCount: activeCargosCountSql,
          })
          .from(departamentos)
          .leftJoin(cargos, eq(cargos.departamentoId, departamentos.id)),
        departamentos,
        searchCondition,
      )
        .groupBy(departamentos.id)
        .orderBy(...buildDepartamentoOrderBy(filters.sort))
        .limit(pagination.pageSize)
        .offset(getPaginationOffset(pagination)),
      notDeleted(
        dbOrTx
          .select({ count: sql<number>`count(*)::int` })
          .from(departamentos),
        departamentos,
        searchCondition,
      ),
    ]);

    return {
      items: rows.map((row) => ({
        ...row,
        activeCargosCount: Number(row.activeCargosCount ?? 0),
      })),
      total: Number(totalRows[0]?.count ?? 0),
    };
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
    const rows = await dbOrTx.insert(departamentos).values(data).returning();
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

  findActiveCargosPage: async (
    departamentoId: string,
    pagination: PaginationInput,
    dbOrTx: DbOrTx = db,
  ): Promise<PaginatedResult<Cargo>> => {
    const [items, totalRows] = await Promise.all([
      notDeleted(
        dbOrTx.select().from(cargos),
        cargos,
        eq(cargos.departamentoId, departamentoId),
      )
        .orderBy(asc(cargos.titulo), asc(cargos.id))
        .limit(pagination.pageSize)
        .offset(getPaginationOffset(pagination)),
      notDeleted(
        dbOrTx.select({ count: sql<number>`count(*)::int` }).from(cargos),
        cargos,
        eq(cargos.departamentoId, departamentoId),
      ),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },
};
