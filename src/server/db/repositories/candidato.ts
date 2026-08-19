import { eq, desc, asc, and, isNull } from "drizzle-orm";
import { db } from "~/server/db";
import {
  candidatos,
  candidatoFormacoes,
  candidatoExperiencias,
  candidatoCertificacoes,
  triagens,
  cargos,
  departamentos,
  vagas,
  type Candidato,
  type CandidatoCompleto,
  type CandidatoFormacao,
  type CandidatoExperiencia,
  type CandidatoCertificacao,
  type Triagem,
} from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;

// Return types
export interface CandidatoSummary {
  id: string;
  nome: string;
  email: string;
  celular: string;
  cidade: string;
  uf: string;
  cargoInteresse: string | null;
  createdAt: string;
}

export interface CandidatoDetailCompleto extends CandidatoCompleto {
  triagens: (Triagem & { 
    vaga: { id: string; cargo: { titulo: string } };
  })[];
  cargoInteresse: { id: string; titulo: string } | null;
  areaInteresse: { id: string; nome: string } | null;
}

export interface DepartamentoOption {
  id: string;
  nome: string;
}

export interface CargoOption {
  id: string;
  titulo: string;
  departamento: {
    id: string;
    nome: string;
  };
}

export const candidatoRepository = {
  findAllActiveSummary: async (dbOrTx: DbOrTx = db): Promise<CandidatoSummary[]> => {
    const rows = await notDeleted(
      dbOrTx
        .select({
          id: candidatos.id,
          nome: candidatos.nome,
          email: candidatos.email,
          celular: candidatos.celular,
          cidade: candidatos.cidade,
          uf: candidatos.uf,
          createdAt: candidatos.createdAt,
          cargoInteresseTitulo: cargos.titulo,
        })
        .from(candidatos)
        .leftJoin(cargos, eq(candidatos.cargoInteresseId, cargos.id)),
      candidatos,
    ).orderBy(desc(candidatos.createdAt));

    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      email: r.email,
      celular: r.celular,
      cidade: r.cidade,
      uf: r.uf,
      createdAt: r.createdAt,
      cargoInteresse: r.cargoInteresseTitulo,
    }));
  },

  findById: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<Candidato | null> => {
    const rows = await notDeleted(
      dbOrTx.select().from(candidatos),
      candidatos,
      eq(candidatos.id, id),
    );
    return rows[0] ?? null;
  },

  findByIdComplete: async (
    id: string,
    dbOrTx: DbOrTx = db,
  ): Promise<CandidatoDetailCompleto | null> => {
    // Busca candidato base com joins para cargo e área
    const baseRows = await notDeleted(
      dbOrTx
        .select({
          candidato: candidatos,
          cargoTitulo: cargos.titulo,
          areaNome: departamentos.nome,
        })
        .from(candidatos)
        .leftJoin(cargos, eq(candidatos.cargoInteresseId, cargos.id))
        .leftJoin(departamentos, eq(candidatos.areaInteresseId, departamentos.id)),
      candidatos,
      eq(candidatos.id, id),
    );

    const baseData = baseRows[0];
    if (!baseData) return null;

    const { candidato, cargoTitulo, areaNome } = baseData;

    // Busca filhos sequencialmente para evitar N+1/produto cartesiano
    const [formacoes, experiencias, certificacoes, triagensRows] = await Promise.all([
      notDeleted(
        dbOrTx.select().from(candidatoFormacoes),
        candidatoFormacoes,
        eq(candidatoFormacoes.candidatoId, id)
      ).orderBy(desc(candidatoFormacoes.dataInicio)),

      notDeleted(
        dbOrTx.select().from(candidatoExperiencias),
        candidatoExperiencias,
        eq(candidatoExperiencias.candidatoId, id)
      ).orderBy(desc(candidatoExperiencias.dataEntrada)),

      notDeleted(
        dbOrTx.select().from(candidatoCertificacoes),
        candidatoCertificacoes,
        eq(candidatoCertificacoes.candidatoId, id)
      ).orderBy(desc(candidatoCertificacoes.obtidaEm)),

      notDeleted(
        dbOrTx
          .select({
            triagem: triagens,
            vagaId: vagas.id,
            cargoTitulo: cargos.titulo,
          })
          .from(triagens)
          .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
          .innerJoin(cargos, eq(vagas.cargoId, cargos.id)),
        triagens,
        eq(triagens.candidatoId, id)
      ).orderBy(desc(triagens.createdAt))
    ]);

    return {
      ...candidato,
      cargoInteresse: candidato.cargoInteresseId 
        ? { id: candidato.cargoInteresseId, titulo: cargoTitulo! } 
        : null,
      areaInteresse: candidato.areaInteresseId 
        ? { id: candidato.areaInteresseId, nome: areaNome! } 
        : null,
      formacoes,
      experiencias,
      certificacoes,
      triagens: triagensRows.map(r => ({
        ...r.triagem,
        vaga: {
          id: r.vagaId,
          cargo: { titulo: r.cargoTitulo },
        }
      })),
    };
  },

  findActiveDepartamentoOptions: async (
    dbOrTx: DbOrTx = db,
  ): Promise<DepartamentoOption[]> => {
    return notDeleted(
      dbOrTx
        .select({
          id: departamentos.id,
          nome: departamentos.nome,
        })
        .from(departamentos),
      departamentos,
    ).orderBy(asc(departamentos.nome));
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

  findByEmailIncludingDeleted: async (
    email: string,
    dbOrTx: DbOrTx = db,
  ): Promise<Candidato | null> => {
    const rows = await dbOrTx
      .select()
      .from(candidatos)
      .where(eq(candidatos.email, email));
    
    return rows[0] ?? null;
  },
};
