import { describe, it, expect } from "vitest";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { eq, type SQL } from "drizzle-orm";
import {
  activeCitiesForVaga,
  matchesActiveVagaCity,
  matchesActiveVagaCityName,
  notDeleted,
} from "./query-helpers";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { vagas } from "./schema";
import * as schema from "./schema";

const testTable = pgTable("test", {
  id: text("id").primaryKey(),
  deletedAt: timestamp("deleted_at"),
});

const client = postgres(
  "postgres://postgres:postgres@localhost:5432/wgotalent",
);
const db = drizzle(client, { schema });

describe("query-helpers", () => {
  describe("notDeleted", () => {
    it("appends isNull(deletedAt) to a basic query", () => {
      const qb = db.select().from(testTable);
      const query = notDeleted(qb, testTable);

      const sql = query.toSQL().sql;
      expect(sql).toContain('"test"."deleted_at" is null');
      expect(sql).not.toContain("and");
    });

    it("combines isNull(deletedAt) with additional conditions", () => {
      const qb = db.select().from(testTable);
      const query = notDeleted(qb, testTable, eq(testTable.id, "123"));

      const sql = query.toSQL().sql;
      expect(sql).toContain('"test"."deleted_at" is null');
      expect(sql).toContain("and");
      expect(sql).toContain('"test"."id" = $1');
    });

    it("ignores undefined conditions and only applies isNull(deletedAt)", () => {
      const qb = db.select().from(testTable);
      const condition: SQL | undefined = undefined;
      const query = notDeleted(qb, testTable, condition);

      const sql = query.toSQL().sql;
      expect(sql).toContain('"test"."deleted_at" is null');
      expect(sql).not.toContain("and");
    });
  });

  describe("active vaga cities", () => {
    it("builds the aggregate from schema-backed tables with soft-delete filters", () => {
      const query = notDeleted(
        db
          .select({
            id: vagas.id,
            cidades: activeCitiesForVaga(db),
          })
          .from(vagas),
        vagas,
      );
      const querySql = query.toSQL().sql;

      expect(querySql).toContain('from "wgotalent_vaga_cidades"');
      expect(querySql).toContain('inner join "wgotalent_cidades"');
      expect(querySql).toContain(
        '"wgotalent_vaga_cidades"."deleted_at" is null',
      );
      expect(querySql).toContain('"wgotalent_cidades"."deleted_at" is null');
    });

    it("builds typed search and exact-name predicates for active cities", () => {
      const searchQuery = notDeleted(
        db.select({ id: vagas.id }).from(vagas),
        vagas,
        matchesActiveVagaCity(db, "%recife%"),
      );
      const exactQuery = notDeleted(
        db.select({ id: vagas.id }).from(vagas),
        vagas,
        matchesActiveVagaCityName(db, "Recife"),
      );

      expect(searchQuery.toSQL().sql).toContain("ilike");
      expect(searchQuery.toSQL().sql).toContain(
        '"wgotalent_vaga_cidades"."deleted_at" is null',
      );
      expect(exactQuery.toSQL().sql).toContain('"wgotalent_cidades"."nome" =');
      expect(exactQuery.toSQL().sql).toContain(
        '"wgotalent_cidades"."deleted_at" is null',
      );
    });
  });
});
