import { sql } from "drizzle-orm";
import {
  pgTableCreator,
  pgEnum,
  timestamp,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  smallint,
  char,
  date,
  check,
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

export const vagas = createTable(
  "vagas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: statusVagaEnum("status").default("aberta").notNull(),
    posicoesDisponiveis: smallint("posicoes_disponiveis").default(1).notNull(),
    cargoId: uuid("cargo_id")
      .notNull()
      .references(() => cargos.id),
    remuneracaoOferecida: numeric("remuneracao_oferecida", {
      precision: 10,
      scale: 2,
    }),
    cidade: varchar("cidade", { length: 100 }).notNull(),
    uf: char("uf", { length: 2 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("vagas_cargo_id_idx").on(table.cargoId),
    check("vagas_posicoes_disponiveis_check", sql`${table.posicoesDisponiveis} > 0`),
  ],
);

export type Vaga = typeof vagas.$inferSelect;
export type NovaVaga = typeof vagas.$inferInsert;

export const candidatos = createTable(
  "candidatos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: varchar("nome", { length: 150 }).notNull(),
    nomeSocial: varchar("nome_social", { length: 150 }),
    nacionalidade: varchar("nacionalidade", { length: 60 }).default("brasileira"),
    dataNascimento: date("data_nascimento", { mode: "string" }),
    estadoCivil: estadoCivilEnum("estado_civil").default("nao_informado"),
    pcd: text("pcd"),
    email: varchar("email", { length: 254 }).notNull().unique(),
    celular: varchar("celular", { length: 20 }).notNull(),
    cep: varchar("cep", { length: 9 }),
    uf: char("uf", { length: 2 }),
    cidade: varchar("cidade", { length: 100 }),
    bairro: varchar("bairro", { length: 100 }),
    logradouro: varchar("logradouro", { length: 200 }),
    resumoProfissional: text("resumo_profissional"),
    cnh: cnhEnum("cnh"),
    possuiVeiculo: boolean("possui_veiculo").default(false).notNull(),
    ensinoMedioConcluido: boolean("ensino_medio_concluido").default(false).notNull(),
    cargoInteresseId: uuid("cargo_interesse_id").references(() => cargos.id),
    areaInteresseId: uuid("area_interesse_id").references(() => departamentos.id),
    disponivelViagens: boolean("disponivel_viagens").default(false).notNull(),
    disponivelMudanca: boolean("disponivel_mudanca").default(false).notNull(),
    disponibilidadeHorarios: text("disponibilidade_horarios"),
    inicioImediato: boolean("inicio_imediato").default(false).notNull(),
    linkedin: varchar("linkedin", { length: 255 }),
    portfolio: varchar("portfolio", { length: 255 }),
    origem: origemEnum("origem").default("manual").notNull(),
    curriculoArquivoKey: text("curriculo_arquivo_key"),
    textoCurriculoExtraido: text("texto_curriculo_extraido"),
    ...timestamps,
  },
  (table) => [
    index("candidatos_cargo_interesse_id_idx").on(table.cargoInteresseId),
    index("candidatos_area_interesse_id_idx").on(table.areaInteresseId),
  ],
);

export type Candidato = typeof candidatos.$inferSelect;
export type NovoCandidato = typeof candidatos.$inferInsert;


