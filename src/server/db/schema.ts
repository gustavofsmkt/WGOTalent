import {
  pgTableCreator,
  pgEnum,
  timestamp,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  index,
} from "drizzle-orm/pg-core";

/**
 * Multi-project schema feature of Drizzle ORM.
 * Prefix all tables with `wgotalent_`.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `wgotalent_${name}`);

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
};

export const departamentos = createTable("departamentos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 120 }).notNull().unique(),
  descricao: text("descricao"),
  ...timestamps,
});

export type Departamento = typeof departamentos.$inferSelect;
export type NovoDepartamento = typeof departamentos.$inferInsert;

export const cargos = createTable(
  "cargos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departamentoId: uuid("departamento_id")
      .notNull()
      .references(() => departamentos.id),
    titulo: varchar("titulo", { length: 150 }).notNull(),
    descricao: text("descricao"),
    ativo: boolean("ativo").default(true).notNull(),
    faixaSalarial: numeric("faixa_salarial", { precision: 10, scale: 2 }),
    requisitos: text("requisitos"),
    requisitosDesejaveis: text("requisitos_desejaveis"),
    criteriosEliminatorios: text("criterios_eliminatorios"),
    ...timestamps,
  },
  (table) => [
    index("cargos_departamento_id_idx").on(table.departamentoId),
  ],
);

export type Cargo = typeof cargos.$inferSelect;
export type NovoCargo = typeof cargos.$inferInsert;

export const statusVagaEnum = pgEnum("status_vaga", [
  "aberta",
  "concluida",
  "cancelada",
  "pausada",
  "incompleta",
]);

export const estadoCivilEnum = pgEnum("estado_civil", [
  "nao_informado",
  "solteiro",
  "casado",
  "divorciado",
  "viuvo",
  "uniao_estavel",
]);

export const cnhEnum = pgEnum("cnh", ["a", "b", "ab", "c", "d", "e"]);

export const origemEnum = pgEnum("origem", ["email", "manual", "indicacao"]);

export const triagemEtapaEnum = pgEnum("triagem_etapa", [
  "curriculo",
  "testes",
  "entrevista_rh",
  "entrevista_gestor",
  "finalizado",
]);

export const triagemResultadoEnum = pgEnum("triagem_resultado", [
  "em_andamento",
  "aprovado",
  "reprovado",
  "desistente",
  "banco_talentos",
]);

export const triagemMotivoEnum = pgEnum("triagem_motivo", [
  "curriculo",
  "fit_cultural",
  "testes",
  "rh",
  "gestor",
  "incompatibilidade_salarial",
  "aceitou_outra_proposta",
  "nao_atendeu_contato",
  "motivos_pessoais",
]);

