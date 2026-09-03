import { eq, and, sql, isNull, asc, desc, gte } from "drizzle-orm";
import { db } from "~/server/db";
import {
  vagas,
  cargos,
  departamentos,
  type Vaga,
  type NovaVaga,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

export interface VagaWithCargoAndDepartamento extends Vaga {
  cargo: {
    id: string;
    titulo: string;
    ativo: boolean;
    descricao: string;
    requisitos: string;
    requisitosDesejaveis: string;
    criteriosEliminatorios: string;
    departamento: {
      id: string;
      nome: string;
    };
  };
}

export interface CargoOption {
  id: string;
  titulo: string;
  departamento: {
    id: string;
    nome: string;
  };
}

export const vagaRepository = {
  findAll: async (dbOrTx: DbOrTx = db): Promise<Vaga[]> => {
    return notDeleted(dbOrTx.select().from(vagas), vagas).orderBy(
      desc(vagas.createdAt),
    );
  },

  findAllWithCargoAndDepartamento: async (
    dbOrTx: DbOrTx = db,
  ): Promise<VagaWithCargoAndDepartamento[]> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          id: vagas.id,
          status: vagas.status,
          posicoesDisponiveis: vagas.posicoesDisponiveis,
          notaCorte: vagas.notaCorte,
          cargoId: vagas.cargoId,
          remuneracaoOferecida: vagas.remuneracaoOferecida,
          cidade: vagas.cidade,
          uf: vagas.uf,
          createdAt: vagas.createdAt,
          updatedAt: vagas.updatedAt,
          deletedAt: vagas.deletedAt,
          cargoIdValue: cargos.id,
          cargoTitulo: cargos.titulo,
          cargoAtivo: cargos.ativo,
          cargoDescricao: cargos.descricao,
          cargoRequisitos: cargos.requisitos,
          cargoRequisitosDesejaveis: cargos.requisitosDesejaveis,
          cargoCriteriosEliminatorios: cargos.criteriosEliminatorios,
          departamentoIdValue: departamentos.id,
          departamentoNome: departamentos.nome,
        })
        .from(vagas)
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      vagas,
    ).orderBy(desc(vagas.createdAt));

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      posicoesDisponiveis: r.posicoesDisponiveis,
      notaCorte: r.notaCorte,
      cargoId: r.cargoId,
      remuneracaoOferecida: r.remuneracaoOferecida,
      cidade: r.cidade,
      uf: r.uf,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      cargo: {
        id: r.cargoIdValue,
        titulo: r.cargoTitulo,
        ativo: r.cargoAtivo,
        descricao: r.cargoDescricao,
        requisitos: r.cargoRequisitos,
        requisitosDesejaveis: r.cargoRequisitosDesejaveis,
        criteriosEliminatorios: r.cargoCriteriosEliminatorios,
        departamento: {
          id: r.departamentoIdValue,
          nome: r.departamentoNome,
        },
      },
    }));
  },

  findById: async (id: string, dbOrTx: DbOrTx = db): Promise<Vaga | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(vagas),
      vagas,
      eq(vagas.id, id),
    );
    return rows[0] ?? null;
  },

  findByIdWithCargoAndDepartamento: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<VagaWithCargoAndDepartamento | null> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          id: vagas.id,
          status: vagas.status,
          posicoesDisponiveis: vagas.posicoesDisponiveis,
          notaCorte: vagas.notaCorte,
          cargoId: vagas.cargoId,
          remuneracaoOferecida: vagas.remuneracaoOferecida,
          cidade: vagas.cidade,
          uf: vagas.uf,
          createdAt: vagas.createdAt,
          updatedAt: vagas.updatedAt,
          deletedAt: vagas.deletedAt,
          cargoIdValue: cargos.id,
          cargoTitulo: cargos.titulo,
          cargoAtivo: cargos.ativo,
          cargoDescricao: cargos.descricao,
          cargoRequisitos: cargos.requisitos,
          cargoRequisitosDesejaveis: cargos.requisitosDesejaveis,
          cargoCriteriosEliminatorios: cargos.criteriosEliminatorios,
          departamentoIdValue: departamentos.id,
          departamentoNome: departamentos.nome,
        })
        .from(vagas)
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      vagas,
      eq(vagas.id, id),
    );

    const r = rows[0];
    if (!r) return null;

    return {
      id: r.id,
      status: r.status,
      posicoesDisponiveis: r.posicoesDisponiveis,
      notaCorte: r.notaCorte,
      cargoId: r.cargoId,
      remuneracaoOferecida: r.remuneracaoOferecida,
      cidade: r.cidade,
      uf: r.uf,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      cargo: {
        id: r.cargoIdValue,
        titulo: r.cargoTitulo,
        ativo: r.cargoAtivo,
        descricao: r.cargoDescricao,
        requisitos: r.cargoRequisitos,
        requisitosDesejaveis: r.cargoRequisitosDesejaveis,
        criteriosEliminatorios: r.cargoCriteriosEliminatorios,
        departamento: {
          id: r.departamentoIdValue,
          nome: r.departamentoNome,
        },
      },
    };
  },

  findHistoricalByIdWithCargoAndDepartamento: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<VagaWithCargoAndDepartamento | null> => {
    const rows = await dbOrTx
      .select({
        id: vagas.id,
        status: vagas.status,
        posicoesDisponiveis: vagas.posicoesDisponiveis,
        notaCorte: vagas.notaCorte,
        cargoId: vagas.cargoId,
        remuneracaoOferecida: vagas.remuneracaoOferecida,
        cidade: vagas.cidade,
        uf: vagas.uf,
        createdAt: vagas.createdAt,
        updatedAt: vagas.updatedAt,
        deletedAt: vagas.deletedAt,
        cargoIdValue: cargos.id,
        cargoTitulo: cargos.titulo,
        cargoAtivo: cargos.ativo,
        cargoDescricao: cargos.descricao,
        cargoRequisitos: cargos.requisitos,
        cargoRequisitosDesejaveis: cargos.requisitosDesejaveis,
        cargoCriteriosEliminatorios: cargos.criteriosEliminatorios,
        departamentoIdValue: departamentos.id,
        departamentoNome: departamentos.nome,
      })
      .from(vagas)
      .leftJoin(cargos, eq(vagas.cargoId, cargos.id))
      .leftJoin(departamentos, eq(cargos.departamentoId, departamentos.id))
      .where(eq(vagas.id, id));

    const r = rows[0];
    if (!r) return null;

    return {
      id: r.id,
      status: r.status,
      posicoesDisponiveis: r.posicoesDisponiveis,
      notaCorte: r.notaCorte,
      cargoId: r.cargoId,
      remuneracaoOferecida: r.remuneracaoOferecida,
      cidade: r.cidade,
      uf: r.uf,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      cargo: {
        id: r.cargoIdValue ?? "",
        titulo: r.cargoTitulo ?? "Cargo não identificado",
        ativo: r.cargoAtivo ?? false,
        descricao: r.cargoDescricao ?? "",
        requisitos: r.cargoRequisitos ?? "",
        requisitosDesejaveis: r.cargoRequisitosDesejaveis ?? "",
        criteriosEliminatorios: r.cargoCriteriosEliminatorios ?? "",
        departamento: {
          id: r.departamentoIdValue ?? "",
          nome: r.departamentoNome ?? "Departamento não identificado",
        },
      },
    };
  },

  findActiveCargoOptions: async (
    dbOrTx: DbOrTx = db,
  ): Promise<CargoOption[]> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          id: cargos.id,
          titulo: cargos.titulo,
          departamento: {
            id: departamentos.id,
            nome: departamentos.nome,
          },
        })
        .from(cargos)
        .innerJoin(
          departamentos,
          and(
            eq(cargos.departamentoId, departamentos.id),
            isNull(departamentos.deletedAt),
          ),
        ),
      cargos,
      eq(cargos.ativo, true),
    ).orderBy(asc(cargos.titulo));

    return rows;
  },

  findOpenByCidade: async (
    cidade: string,
    dbOrTx: DbOrTx = db,
  ): Promise<VagaWithCargoAndDepartamento[]> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          id: vagas.id,
          status: vagas.status,
          posicoesDisponiveis: vagas.posicoesDisponiveis,
          notaCorte: vagas.notaCorte,
          cargoId: vagas.cargoId,
          remuneracaoOferecida: vagas.remuneracaoOferecida,
          cidade: vagas.cidade,
          uf: vagas.uf,
          createdAt: vagas.createdAt,
          updatedAt: vagas.updatedAt,
          deletedAt: vagas.deletedAt,
          cargoIdValue: cargos.id,
          cargoTitulo: cargos.titulo,
          cargoAtivo: cargos.ativo,
          cargoDescricao: cargos.descricao,
          cargoRequisitos: cargos.requisitos,
          cargoRequisitosDesejaveis: cargos.requisitosDesejaveis,
          cargoCriteriosEliminatorios: cargos.criteriosEliminatorios,
          departamentoIdValue: departamentos.id,
          departamentoNome: departamentos.nome,
        })
        .from(vagas)
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      vagas,
      and(eq(vagas.status, "aberta"), eq(vagas.cidade, cidade)),
    ).orderBy(desc(vagas.createdAt));

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      posicoesDisponiveis: r.posicoesDisponiveis,
      notaCorte: r.notaCorte,
      cargoId: r.cargoId,
      remuneracaoOferecida: r.remuneracaoOferecida,
      cidade: r.cidade,
      uf: r.uf,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
      cargo: {
        id: r.cargoIdValue,
        titulo: r.cargoTitulo,
        ativo: r.cargoAtivo,
        descricao: r.cargoDescricao,
        requisitos: r.cargoRequisitos,
        requisitosDesejaveis: r.cargoRequisitosDesejaveis,
        criteriosEliminatorios: r.cargoCriteriosEliminatorios,
        departamento: {
          id: r.departamentoIdValue,
          nome: r.departamentoNome,
        },
      },
    }));
  },

  existsRecentDuplicate: async (
    data: {
      cargoId: string;
      cidade: string;
      uf: string;
      status: string;
      posicoesDisponiveis: number;
      notaCorte: string;
      remuneracaoOferecida?: string | null;
    },
    dbOrTx: DbOrTx = db,
  ): Promise<boolean> => {
    // Guard contra duplo-submit: mesma vaga (todos os campos do payload) criada nos últimos 10s.
    const rows = await notDeleted(
      dbOrTx.select({ id: vagas.id }).from(vagas),
      vagas,
      eq(vagas.cargoId, data.cargoId),
      eq(vagas.cidade, data.cidade),
      eq(vagas.uf, data.uf),
      eq(vagas.status, data.status as Vaga["status"]),
      eq(vagas.posicoesDisponiveis, data.posicoesDisponiveis),
      eq(vagas.notaCorte, data.notaCorte),
      data.remuneracaoOferecida
        ? eq(vagas.remuneracaoOferecida, data.remuneracaoOferecida)
        : isNull(vagas.remuneracaoOferecida),
      gte(vagas.createdAt, sql`now() - interval '10 seconds'`),
    ).limit(1);
    return rows.length > 0;
  },

  create: async (data: NovaVaga, dbOrTx: DbOrTx = db): Promise<Vaga> => {
    const rows = await dbOrTx.insert(vagas).values(data).returning();
    const created = rows[0];
    if (!created) {
      throw new Error("Falha ao criar vaga.");
    }
    return created;
  },

  update: async (
    id: string,
    data: Partial<NovaVaga>,
    dbOrTx: DbOrTx = db,
  ): Promise<Vaga | null> => {
    const rows = await dbOrTx
      .update(vagas)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(vagas.id, id))
      .returning();
    return rows[0] ?? null;
  },

  softDelete: async (id: string, dbOrTx: DbOrTx = db): Promise<Vaga | null> => {
    const rows = await dbOrTx
      .update(vagas)
      .set({ deletedAt: sql`now()` })
      .where(eq(vagas.id, id))
      .returning();
    return rows[0] ?? null;
  },
};
