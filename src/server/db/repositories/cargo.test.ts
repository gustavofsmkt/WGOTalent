import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import { cargoRepository } from "./cargo";
import { cargos, vagas, departamentos } from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(
  "postgres://postgres:postgres@localhost:5432/wgotalent",
);
const mockDb = drizzle(client);

describe("cargoRepository", () => {
  it("exports a named repository object with required methods", () => {
    expect(cargoRepository).toBeDefined();
    expect(typeof cargoRepository.findAll).toBe("function");
    expect(typeof cargoRepository.findPageWithDepartamento).toBe("function");
    expect(typeof cargoRepository.findById).toBe("function");
    expect(typeof cargoRepository.findByIdWithDepartamento).toBe("function");
    expect(typeof cargoRepository.findActiveDepartamentoOptions).toBe(
      "function",
    );
    expect(typeof cargoRepository.create).toBe("function");
    expect(typeof cargoRepository.update).toBe("function");
    expect(typeof cargoRepository.softDelete).toBe("function");
    expect(typeof cargoRepository.hasActiveVagas).toBe("function");
    expect(typeof cargoRepository.countActiveVagas).toBe("function");
    expect(typeof cargoRepository.findActiveVagasPage).toBe("function");
  });

  it("builds query with notDeleted filter for findAll", () => {
    const qb = notDeleted(mockDb.select().from(cargos), cargos);
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_cargos"."deleted_at" is null');
  });

  it("builds query with notDeleted and join for paginated cargo lists", () => {
    const qb = notDeleted(
      mockDb
        .select({
          id: cargos.id,
          departamentoId: cargos.departamentoId,
          titulo: cargos.titulo,
        })
        .from(cargos)
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      cargos,
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_cargos"."deleted_at" is null');
  });

  it("builds vaga check query with notDeleted for hasActiveVagas", () => {
    const qb = notDeleted(mockDb.select({ id: vagas.id }).from(vagas), vagas);
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_vagas"."deleted_at" is null');
  });
});
