import { eq, desc, asc, and, isNull, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import {
  candidatos,
  candidatoFormacoes,
  candidatoExperiencias,
  candidatoCertificacoes,
  triagens,
  avaliacaoIA,
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
import { type CandidatoAgregadoOutput } from "~/lib/validation/candidato";

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
  origem: "email" | "manual" | "indicacao";
  cargoInteresse: string | null;
  createdAt: string;
}

export interface CandidatoDetailCompleto extends CandidatoCompleto {
  triagens: (Triagem & { 
    vaga: { id: string; cargo: { titulo: string } };
    avaliacaoIA?: {
      id: string;
      scoreIa: string;
      parecerIa: string;
    } | null;
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
          origem: candidatos.origem,
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
      origem: r.origem,
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
            avaliacaoIaId: avaliacaoIA.id,
            avaliacaoIaScore: avaliacaoIA.scoreIa,
            avaliacaoIaParecer: avaliacaoIA.parecerIa,
          })
          .from(triagens)
          .innerJoin(vagas, eq(triagens.vagaId, vagas.id))
          .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
          .leftJoin(
            avaliacaoIA,
            and(
              eq(avaliacaoIA.triagemId, triagens.id),
              isNull(avaliacaoIA.deletedAt),
            ),
          ),
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
        },
        avaliacaoIA: r.avaliacaoIaId
          ? {
              id: r.avaliacaoIaId,
              scoreIa: r.avaliacaoIaScore!,
              parecerIa: r.avaliacaoIaParecer!,
            }
          : null,
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

  createAggregate: async (
    data: CandidatoAgregadoOutput,
    dbOrTx: DbOrTx = db,
  ): Promise<CandidatoDetailCompleto | null> => {
    return dbOrTx.transaction(async (tx) => {
      const { formacoes, experiencias, certificacoes, ...candidatoData } = data;

      const [candidato] = await tx
        .insert(candidatos)
        .values(candidatoData)
        .returning();

      if (!candidato) throw new Error("Falha ao inserir candidato");

      if (formacoes.length > 0) {
        await tx.insert(candidatoFormacoes).values(
          formacoes.map((f) => ({
            ...f,
            candidatoId: candidato.id,
          }))
        );
      }

      if (experiencias.length > 0) {
        await tx.insert(candidatoExperiencias).values(
          experiencias.map((e) => ({
            ...e,
            candidatoId: candidato.id,
          }))
        );
      }

      if (certificacoes.length > 0) {
        await tx.insert(candidatoCertificacoes).values(
          certificacoes.map((c) => ({
            ...c,
            candidatoId: candidato.id,
          }))
        );
      }

      const res = await candidatoRepository.findByIdComplete(candidato.id, tx);
      return res;
    });
  },

  updateAggregate: async (
    id: string,
    data: CandidatoAgregadoOutput,
    dbOrTx: DbOrTx = db,
  ): Promise<CandidatoDetailCompleto | null> => {
    return dbOrTx.transaction(async (tx) => {
      const { formacoes, experiencias, certificacoes, origem: _origem, ...candidatoData } = data;

      // Ensure no id is passed in candidatoData just to be safe
      const { id: _, ...updateData } = candidatoData;

      await tx
        .update(candidatos)
        .set({ ...updateData, updatedAt: new Date().toISOString() })
        .where(eq(candidatos.id, id));

      // Reconcile Formações
      const currentFormacoes = await notDeleted(tx.select().from(candidatoFormacoes), candidatoFormacoes, eq(candidatoFormacoes.candidatoId, id));
      const incomingFormacoesIds = formacoes.map(f => f.id).filter(Boolean);
      const formacoesToDelete = currentFormacoes.filter(f => !incomingFormacoesIds.includes(f.id));

      if (formacoesToDelete.length > 0) {
        for (const f of formacoesToDelete) {
           await tx.update(candidatoFormacoes).set({ deletedAt: new Date().toISOString() }).where(eq(candidatoFormacoes.id, f.id));
        }
      }

      for (const f of formacoes) {
        if (f.id) {
          const { id: fId, ...fData } = f;
          await tx.update(candidatoFormacoes).set({ ...fData, updatedAt: new Date().toISOString() }).where(and(eq(candidatoFormacoes.id, f.id), eq(candidatoFormacoes.candidatoId, id)));
        } else {
          await tx.insert(candidatoFormacoes).values({ ...f, candidatoId: id });
        }
      }

      // Reconcile Experiencias
      const currentExperiencias = await notDeleted(tx.select().from(candidatoExperiencias), candidatoExperiencias, eq(candidatoExperiencias.candidatoId, id));
      const incomingExperienciasIds = experiencias.map(e => e.id).filter(Boolean);
      const experienciasToDelete = currentExperiencias.filter(e => !incomingExperienciasIds.includes(e.id));

      if (experienciasToDelete.length > 0) {
        for (const e of experienciasToDelete) {
           await tx.update(candidatoExperiencias).set({ deletedAt: new Date().toISOString() }).where(eq(candidatoExperiencias.id, e.id));
        }
      }

      for (const e of experiencias) {
        if (e.id) {
          const { id: eId, ...eData } = e;
          await tx.update(candidatoExperiencias).set({ ...eData, updatedAt: new Date().toISOString() }).where(and(eq(candidatoExperiencias.id, e.id), eq(candidatoExperiencias.candidatoId, id)));
        } else {
          await tx.insert(candidatoExperiencias).values({ ...e, candidatoId: id });
        }
      }

      // Reconcile Certificacoes
      const currentCertificacoes = await notDeleted(tx.select().from(candidatoCertificacoes), candidatoCertificacoes, eq(candidatoCertificacoes.candidatoId, id));
      const incomingCertificacoesIds = certificacoes.map(c => c.id).filter(Boolean);
      const certificacoesToDelete = currentCertificacoes.filter(c => !incomingCertificacoesIds.includes(c.id));

      if (certificacoesToDelete.length > 0) {
        for (const c of certificacoesToDelete) {
           await tx.update(candidatoCertificacoes).set({ deletedAt: new Date().toISOString() }).where(eq(candidatoCertificacoes.id, c.id));
        }
      }

      for (const c of certificacoes) {
        if (c.id) {
          const { id: cId, ...cData } = c;
          await tx.update(candidatoCertificacoes).set({ ...cData, updatedAt: new Date().toISOString() }).where(and(eq(candidatoCertificacoes.id, c.id), eq(candidatoCertificacoes.candidatoId, id)));
        } else {
          await tx.insert(candidatoCertificacoes).values({ ...c, candidatoId: id });
        }
      }

      const res = await candidatoRepository.findByIdComplete(id, tx);
      return res;
    });
  },

  softDelete: async (id: string, dbOrTx: DbOrTx = db): Promise<void> => {
    await dbOrTx.transaction(async (tx) => {
      const deletedAt = new Date().toISOString();

      // Check if already deleted (idempotent)
      const candidato = await tx
        .select({ deletedAt: candidatos.deletedAt })
        .from(candidatos)
        .where(eq(candidatos.id, id));

      if (!candidato[0] || candidato[0].deletedAt) {
        return; // Already deleted or not found
      }

      // Soft delete candidato
      await tx
        .update(candidatos)
        .set({ deletedAt })
        .where(eq(candidatos.id, id));

      // Soft delete formacoes
      await tx
        .update(candidatoFormacoes)
        .set({ deletedAt })
        .where(eq(candidatoFormacoes.candidatoId, id));

      // Soft delete experiencias
      await tx
        .update(candidatoExperiencias)
        .set({ deletedAt })
        .where(eq(candidatoExperiencias.candidatoId, id));

      // Soft delete certificacoes
      await tx
        .update(candidatoCertificacoes)
        .set({ deletedAt })
        .where(eq(candidatoCertificacoes.candidatoId, id));

      // Find triagens to soft delete avaliacaoIA
      const triagensRows = await tx
        .select({ id: triagens.id })
        .from(triagens)
        .where(eq(triagens.candidatoId, id));

      if (triagensRows.length > 0) {
        const triagemIds = triagensRows.map((t) => t.id);

        // Soft delete avaliacaoIA
        await tx
          .update(avaliacaoIA)
          .set({ deletedAt })
          .where(inArray(avaliacaoIA.triagemId, triagemIds));
          
        // Soft delete triagens
        await tx
          .update(triagens)
          .set({ deletedAt })
          .where(eq(triagens.candidatoId, id));
      }
    });
  },
};
