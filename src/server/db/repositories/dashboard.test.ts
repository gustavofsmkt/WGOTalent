import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));
vi.mock("~/server/db/query-helpers", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/server/db/query-helpers")>();
  return { ...actual, notDeleted: vi.fn(actual.notDeleted) };
});

import { dashboardRepository, type DbOrTx } from "./dashboard";
import {
  vagas,
  candidatos,
  triagens,
  avaliacaoIA,
  cargos,
  departamentos,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import { and, countDistinct, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(
  "postgres://postgres:postgres@localhost:5432/wgotalent",
);
const mockDb = drizzle(client);

describe("dashboardRepository", () => {
  it("exports a named repository object with required methods", () => {
    expect(dashboardRepository).toBeDefined();
    expect(typeof dashboardRepository.countVagasAbertas).toBe("function");
    expect(typeof dashboardRepository.countCandidatosAtivos).toBe("function");
    expect(typeof dashboardRepository.countTriagensEmAndamento).toBe(
      "function",
    );
    expect(typeof dashboardRepository.countTriagensTotais).toBe("function");
    expect(typeof dashboardRepository.getTriagensPorEtapa).toBe("function");
    expect(typeof dashboardRepository.getTriagensPorResultado).toBe("function");
    expect(typeof dashboardRepository.getMediaScoreIa).toBe("function");
    expect(typeof dashboardRepository.getVagasComMaisCandidatosPage).toBe(
      "function",
    );
    expect(typeof dashboardRepository.getAtividadeRecentePage).toBe("function");
    expect(typeof dashboardRepository.getDashboardSummary).toBe("function");
  });

  describe("SQL query structure & notDeleted filters", () => {
    it("builds countVagasAbertas query with notDeleted filter and status = 'aberta'", () => {
      const qb = notDeleted(
        mockDb
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(vagas),
        vagas,
        eq(vagas.status, "aberta"),
      );
      const querySql = qb.toSQL().sql;
      expect(querySql).toContain('"wgotalent_vagas"."deleted_at" is null');
      expect(querySql).toContain('"wgotalent_vagas"."status" =');
    });

    it("builds countCandidatosAtivos query with notDeleted filter", () => {
      const qb = notDeleted(
        mockDb
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(candidatos),
        candidatos,
      );
      const querySql = qb.toSQL().sql;
      expect(querySql).toContain('"wgotalent_candidatos"."deleted_at" is null');
    });

    it("builds countTriagensEmAndamento query with notDeleted filter and resultado = 'em_andamento'", () => {
      const qb = notDeleted(
        mockDb
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(triagens),
        triagens,
        eq(triagens.resultado, "em_andamento"),
      );
      const querySql = qb.toSQL().sql;
      expect(querySql).toContain('"wgotalent_triagens"."deleted_at" is null');
      expect(querySql).toContain('"wgotalent_triagens"."resultado" =');
    });

    it("builds countTriagensTotais query with notDeleted filter", () => {
      const qb = notDeleted(
        mockDb
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(triagens),
        triagens,
      );
      const querySql = qb.toSQL().sql;
      expect(querySql).toContain('"wgotalent_triagens"."deleted_at" is null');
    });

    it("builds getTriagensPorEtapa query with notDeleted and groupBy etapa", () => {
      const qb = notDeleted(
        mockDb
          .select({
            etapa: triagens.etapa,
            count: sql<number>`count(*)::int`,
          })
          .from(triagens),
        triagens,
      ).groupBy(triagens.etapa);
      const querySql = qb.toSQL().sql;
      expect(querySql).toContain('"wgotalent_triagens"."deleted_at" is null');
      expect(querySql).toContain('group by "wgotalent_triagens"."etapa"');
    });

    it("builds getTriagensPorResultado query with notDeleted and groupBy resultado", () => {
      const qb = notDeleted(
        mockDb
          .select({
            resultado: triagens.resultado,
            count: sql<number>`count(*)::int`,
          })
          .from(triagens),
        triagens,
      ).groupBy(triagens.resultado);
      const querySql = qb.toSQL().sql;
      expect(querySql).toContain('"wgotalent_triagens"."deleted_at" is null');
      expect(querySql).toContain('group by "wgotalent_triagens"."resultado"');
    });

    it("builds getMediaScoreIa query joining triagens with deleted_at filters on both", () => {
      const qb = mockDb
        .select({
          media: sql<
            number | null
          >`round(avg(${avaliacaoIA.scoreIa}::numeric), 1)::float`,
          total: sql<number>`count(*)::int`,
        })
        .from(avaliacaoIA)
        .innerJoin(triagens, eq(avaliacaoIA.triagemId, triagens.id))
        .where(and(isNull(avaliacaoIA.deletedAt), isNull(triagens.deletedAt)));
      const querySql = qb.toSQL().sql;
      expect(querySql).toContain(
        '"wgotalent_avaliacao_ia"."deleted_at" is null',
      );
      expect(querySql).toContain('"wgotalent_triagens"."deleted_at" is null');
      expect(querySql).toContain(
        '"wgotalent_avaliacao_ia"."triagem_id" = "wgotalent_triagens"."id"',
      );
    });

    it("builds getVagasComMaisCandidatos query with joins, group by, and order by count", () => {
      const qb = mockDb
        .select({
          vagaId: vagas.id,
          cargoTitulo: cargos.titulo,
          departamentoNome: departamentos.nome,
          posicoesDisponiveis: vagas.posicoesDisponiveis,
          totalCandidatos: sql<number>`count(${triagens.id}) filter (where ${triagens.deletedAt} is null)::int`,
        })
        .from(vagas)
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
        .leftJoin(triagens, eq(vagas.id, triagens.vagaId))
        .where(isNull(vagas.deletedAt))
        .groupBy(
          vagas.id,
          cargos.titulo,
          departamentos.nome,
          vagas.posicoesDisponiveis,
        )
        .orderBy(
          desc(
            sql`count(${triagens.id}) filter (where ${triagens.deletedAt} is null)`,
          ),
          desc(vagas.createdAt),
        )
        .limit(5);

      const querySql = qb.toSQL().sql;
      expect(querySql).toContain('"wgotalent_vagas"."deleted_at" is null');
      expect(querySql).toContain("limit $");

      const countQb = notDeleted(
        mockDb
          .select({ count: countDistinct(vagas.id) })
          .from(vagas)
          .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
          .innerJoin(
            departamentos,
            eq(cargos.departamentoId, departamentos.id),
          ),
        vagas,
      );
      const countSql = countQb.toSQL().sql;
      expect(countSql).toContain("count(distinct");
      expect(countSql).toContain('inner join "wgotalent_cargos"');
      expect(countSql).toContain('inner join "wgotalent_departamentos"');
    });

    it("builds getAtividadeRecente query with notDeleted on triagens and limit", () => {
      const qb = mockDb
        .select({
          id: triagens.id,
          candidatoId: candidatos.id,
          candidatoNome: candidatos.nome,
          vagaId: vagas.id,
          cargoTitulo: cargos.titulo,
          departamentoNome: departamentos.nome,
          etapa: triagens.etapa,
          resultado: triagens.resultado,
          motivo: triagens.motivo,
          scoreIa: avaliacaoIA.scoreIa,
          createdAt: triagens.createdAt,
          updatedAt: triagens.updatedAt,
        })
        .from(triagens)
        .innerJoin(candidatos, eq(triagens.candidatoId, candidatos.id))
        .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
        .leftJoin(
          avaliacaoIA,
          and(
            eq(triagens.id, avaliacaoIA.triagemId),
            isNull(avaliacaoIA.deletedAt),
          ),
        )
        .where(isNull(triagens.deletedAt))
        .orderBy(desc(triagens.updatedAt), desc(triagens.createdAt))
        .limit(5);

      const querySql = qb.toSQL().sql;
      expect(querySql).toContain('"wgotalent_triagens"."deleted_at" is null');
    });
  });

  describe("mocked execution behavior", () => {
    it("handles getTriagensPorEtapa defaults and mapping", async () => {
      const mockFakeDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              groupBy: async () => [
                { etapa: "curriculo", count: 10 },
                { etapa: "testes", count: 5 },
                { etapa: "entrevista_rh", count: 3 },
              ],
            }),
          }),
        }),
      } as unknown as DbOrTx;

      const result = await dashboardRepository.getTriagensPorEtapa(mockFakeDb);
      expect(result).toEqual({
        curriculo: 10,
        testes: 5,
        entrevista_rh: 3,
        entrevista_gestor: 0,
        finalizado: 0,
      });
    });

    it("handles getTriagensPorResultado defaults and includes all 5 enums", async () => {
      const mockFakeDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              groupBy: async () => [
                { resultado: "em_andamento", count: 20 },
                { resultado: "aprovado", count: 4 },
                { resultado: "desistente", count: 1 },
              ],
            }),
          }),
        }),
      } as unknown as DbOrTx;

      const result =
        await dashboardRepository.getTriagensPorResultado(mockFakeDb);
      expect(result).toEqual({
        em_andamento: 20,
        aprovado: 4,
        reprovado: 0,
        desistente: 1,
        banco_talentos: 0,
      });
    });

    it("handles getMediaScoreIa when no evaluations exist", async () => {
      const mockFakeDb = {
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              where: async () => [{ media: null, total: 0 }],
            }),
          }),
        }),
      } as unknown as DbOrTx;

      const result = await dashboardRepository.getMediaScoreIa(mockFakeDb);
      expect(result).toEqual({
        media: null,
        totalAvaliadas: 0,
      });
    });

    it("handles getMediaScoreIa when evaluations exist", async () => {
      const mockFakeDb = {
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              where: async () => [{ media: 82.5, total: 14 }],
            }),
          }),
        }),
      } as unknown as DbOrTx;

      const result = await dashboardRepository.getMediaScoreIa(mockFakeDb);
      expect(result).toEqual({
        media: 82.5,
        totalAvaliadas: 14,
      });
    });

    it("getMediaScoreIa routes its filter through notDeleted() on avaliacaoIA instead of an inline isNull", async () => {
      vi.mocked(notDeleted).mockClear();
      const mockFakeDb = {
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              where: async () => [{ media: 82.5, total: 14 }],
            }),
          }),
        }),
      } as unknown as DbOrTx;

      await dashboardRepository.getMediaScoreIa(mockFakeDb);

      expect(notDeleted).toHaveBeenCalledWith(
        expect.anything(),
        avaliacaoIA,
        expect.anything(),
      );
    });

    it("exposes paginated dashboard table queries", () => {
      expect(typeof dashboardRepository.getVagasComMaisCandidatosPage).toBe(
        "function",
      );
      expect(typeof dashboardRepository.getAtividadeRecentePage).toBe(
        "function",
      );
    });

    it("handles getDashboardSummary aggregate call", async () => {
      const spyAbertas = vi
        .spyOn(dashboardRepository, "countVagasAbertas")
        .mockResolvedValueOnce(8);
      const spyCandidatos = vi
        .spyOn(dashboardRepository, "countCandidatosAtivos")
        .mockResolvedValueOnce(150);
      const spyTriagensAndamento = vi
        .spyOn(dashboardRepository, "countTriagensEmAndamento")
        .mockResolvedValueOnce(35);
      const spyTriagensTotais = vi
        .spyOn(dashboardRepository, "countTriagensTotais")
        .mockResolvedValueOnce(80);
      const spyMediaIa = vi
        .spyOn(dashboardRepository, "getMediaScoreIa")
        .mockResolvedValueOnce({ media: 78.4, totalAvaliadas: 30 });
      const spyEtapas = vi
        .spyOn(dashboardRepository, "getTriagensPorEtapa")
        .mockResolvedValueOnce({
          curriculo: 15,
          testes: 10,
          entrevista_rh: 5,
          entrevista_gestor: 3,
          finalizado: 2,
        });
      const spyResultados = vi
        .spyOn(dashboardRepository, "getTriagensPorResultado")
        .mockResolvedValueOnce({
          em_andamento: 35,
          aprovado: 20,
          reprovado: 15,
          desistente: 5,
          banco_talentos: 5,
        });
      const spyVagasMais = vi
        .spyOn(dashboardRepository, "getVagasComMaisCandidatosPage")
        .mockResolvedValueOnce({
          items: [
            {
              vagaId: "vaga-1",
              cargoTitulo: "Dev Fullstack",
              departamentoNome: "Tecnologia",
              cidades: [{ id: "cidade-1", nome: "São Paulo", uf: "SP" }],
              posicoesDisponiveis: 2,
              totalCandidatos: 25,
            },
          ],
          total: 1,
        });
      const spyAtividades = vi
        .spyOn(dashboardRepository, "getAtividadeRecentePage")
        .mockResolvedValueOnce({
          items: [
            {
              id: "triagem-1",
              candidatoId: "cand-1",
              candidatoNome: "Ana Silva",
              vagaId: "vaga-1",
              cargoTitulo: "Dev Fullstack",
              departamentoNome: "Tecnologia",
              etapa: "entrevista_rh",
              resultado: "em_andamento",
              motivo: null,
              scoreIa: "85.00",
              createdAt: "2026-08-20T10:00:00Z",
              updatedAt: "2026-08-20T12:00:00Z",
            },
          ],
          total: 1,
        });

      const summary = await dashboardRepository.getDashboardSummary();

      expect(summary.vagasAbertas).toBe(8);
      expect(summary.candidatosAtivos).toBe(150);
      expect(summary.triagensEmAndamento).toBe(35);
      expect(summary.triagensTotais).toBe(80);
      expect(summary.mediaScoreIa).toEqual({ media: 78.4, totalAvaliadas: 30 });
      expect(summary.triagensPorEtapa.curriculo).toBe(15);
      expect(summary.triagensPorResultado.desistente).toBe(5);
      expect(summary.vagasComMaisCandidatos.items).toHaveLength(1);
      expect(summary.atividadeRecente.items).toHaveLength(1);

      spyAbertas.mockRestore();
      spyCandidatos.mockRestore();
      spyTriagensAndamento.mockRestore();
      spyTriagensTotais.mockRestore();
      spyMediaIa.mockRestore();
      spyEtapas.mockRestore();
      spyResultados.mockRestore();
      spyVagasMais.mockRestore();
      spyAtividades.mockRestore();
    });
  });
});
