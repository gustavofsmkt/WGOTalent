import { relations, sql, eq, and, isNull } from "drizzle-orm";
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
  integer,
  bigint,
  char,
  date,
  check,
  index,
  uniqueIndex,
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

export const cidades = createTable(
  "cidades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: varchar("nome", { length: 100 }).notNull(),
    uf: char("uf", { length: 2 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("cidades_nome_uf_idx").on(table.nome, table.uf)],
);

export type Cidade = typeof cidades.$inferSelect;
export type NovaCidade = typeof cidades.$inferInsert;

export const departamentos = createTable("departamentos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 120 }).notNull().unique(),
  descricao: text("descricao").notNull(),
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
    descricao: text("descricao").notNull(),
    ativo: boolean("ativo").default(true).notNull(),
    faixaSalarial: numeric("faixa_salarial", { precision: 10, scale: 2 }),
    requisitos: text("requisitos").notNull(),
    requisitosDesejaveis: text("requisitos_desejaveis").notNull(),
    criteriosEliminatorios: text("criterios_eliminatorios").notNull(),
    ...timestamps,
  },
  (table) => [index("cargos_departamento_id_idx").on(table.departamentoId)],
);

export type Cargo = typeof cargos.$inferSelect;
export type NovoCargo = typeof cargos.$inferInsert;

export const vagas = createTable(
  "vagas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: statusVagaEnum("status").default("aberta").notNull(),
    posicoesDisponiveis: smallint("posicoes_disponiveis").default(1).notNull(),
    notaCorte: numeric("nota_corte", { precision: 5, scale: 2 })
      .default("65.00")
      .notNull(),
    cargoId: uuid("cargo_id")
      .notNull()
      .references(() => cargos.id),
    remuneracaoOferecida: numeric("remuneracao_oferecida", {
      precision: 10,
      scale: 2,
    }),
    ...timestamps,
  },
  (table) => [
    index("vagas_cargo_id_idx").on(table.cargoId),
    check(
      "vagas_posicoes_disponiveis_check",
      sql`${table.posicoesDisponiveis} > 0`,
    ),
    check(
      "vagas_nota_corte_check",
      sql`${table.notaCorte} >= 0 AND ${table.notaCorte} <= 100`,
    ),
  ],
);

export type Vaga = typeof vagas.$inferSelect;
export type NovaVaga = typeof vagas.$inferInsert;

export const vagaCidades = createTable(
  "vaga_cidades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vagaId: uuid("vaga_id")
      .notNull()
      .references(() => vagas.id),
    cidadeId: uuid("cidade_id")
      .notNull()
      .references(() => cidades.id),
    ...timestamps,
  },
  (table) => [
    index("vaga_cidades_vaga_id_idx").on(table.vagaId),
    uniqueIndex("vaga_cidades_vaga_cidade_idx")
      .on(table.vagaId, table.cidadeId)
      .where(isNull(table.deletedAt)),
  ],
);

export type VagaCidade = typeof vagaCidades.$inferSelect;
export type NovaVagaCidade = typeof vagaCidades.$inferInsert;

export const candidatos = createTable(
  "candidatos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: varchar("nome", { length: 150 }).notNull(),
    nomeSocial: varchar("nome_social", { length: 150 }),
    nacionalidade: varchar("nacionalidade", { length: 60 })
      .default("brasileira")
      .notNull(),
    // dataNascimento/cep/bairro/logradouro são nullable: um currículo raramente
    // traz endereço postal completo ou data de nascimento. Decisão de produto
    // (2026-08-19): o Candidato segue no fluxo normal de triagem mesmo assim;
    // dadosPendentes lista o que falta para o RH completar depois.
    dataNascimento: date("data_nascimento", { mode: "string" }),
    estadoCivil: estadoCivilEnum("estado_civil")
      .default("nao_informado")
      .notNull(),
    pcd: text("pcd"),
    email: varchar("email", { length: 254 }).unique(),
    celular: varchar("celular", { length: 20 }).unique(),
    cep: varchar("cep", { length: 9 }),
    uf: char("uf", { length: 2 }).notNull(),
    cidade: varchar("cidade", { length: 100 }).notNull(),
    bairro: varchar("bairro", { length: 100 }),
    logradouro: varchar("logradouro", { length: 200 }),
    dadosPendentes: text("dados_pendentes"),
    resumoProfissional: text("resumo_profissional").notNull(),
    cnh: cnhEnum("cnh"),
    possuiVeiculo: boolean("possui_veiculo").default(false).notNull(),
    ensinoMedioConcluido: boolean("ensino_medio_concluido")
      .default(false)
      .notNull(),
    cargoInteresseId: uuid("cargo_interesse_id").references(() => cargos.id),
    areaInteresseId: uuid("area_interesse_id").references(
      () => departamentos.id,
    ),
    disponivelViagens: boolean("disponivel_viagens").default(false).notNull(),
    disponivelMudanca: boolean("disponivel_mudanca").default(false).notNull(),
    disponibilidadeHorarios: text("disponibilidade_horarios"),
    inicioImediato: boolean("inicio_imediato").default(false).notNull(),
    linkedin: varchar("linkedin", { length: 255 }),
    portfolio: varchar("portfolio", { length: 255 }),
    origem: origemEnum("origem").default("manual").notNull(),
    emBancoTalentos: boolean("em_banco_talentos").default(false).notNull(),
    curriculoArquivoKey: text("curriculo_arquivo_key"),
    textoCurriculoExtraido: text("texto_curriculo_extraido"),
    observacoesRh: text("observacoes_rh"),
    ...timestamps,
  },
  (table) => [
    index("candidatos_cargo_interesse_id_idx").on(table.cargoInteresseId),
    index("candidatos_area_interesse_id_idx").on(table.areaInteresseId),
  ],
);

export type Candidato = typeof candidatos.$inferSelect;
export type NovoCandidato = typeof candidatos.$inferInsert;

export const candidatoFormacoes = createTable(
  "candidato_formacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => candidatos.id),
    titulo: varchar("titulo", { length: 150 }).notNull(),
    instituicao: varchar("instituicao", { length: 150 }),
    areaFormacao: varchar("area_formacao", { length: 120 }).notNull(),
    dataInicio: date("data_inicio", { mode: "string" }).notNull(),
    dataTermino: date("data_termino", { mode: "string" }),
    ...timestamps,
  },
  (table) => [
    index("candidato_formacoes_candidato_id_idx").on(table.candidatoId),
  ],
);

export type CandidatoFormacao = typeof candidatoFormacoes.$inferSelect;
export type NovaCandidatoFormacao = typeof candidatoFormacoes.$inferInsert;

export const candidatoExperiencias = createTable(
  "candidato_experiencias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => candidatos.id),
    empresa: varchar("empresa", { length: 150 }),
    cargoTitulo: varchar("cargo_titulo", { length: 150 }).notNull(),
    descricao: text("descricao"),
    dataEntrada: date("data_entrada", { mode: "string" }).notNull(),
    dataSaida: date("data_saida", { mode: "string" }),
    ...timestamps,
  },
  (table) => [
    index("candidato_experiencias_candidato_id_idx").on(table.candidatoId),
  ],
);

export type CandidatoExperiencia = typeof candidatoExperiencias.$inferSelect;
export type NovaCandidatoExperiencia =
  typeof candidatoExperiencias.$inferInsert;
export type CandidatoExperienciaProfissional = CandidatoExperiencia;

export const uploadLoteStatusEnum = pgEnum("upload_lote_status", [
  "pendente",
  "processando",
  "sucesso",
  "erro",
]);

/**
 * Rastreia cada arquivo de um lote de upload de currículos processado em
 * background (desacoplado da requisição HTTP que o criou), para que o
 * progresso e as falhas sobrevivam a reload de página — ver ADR upload
 * assíncrono. Não é uma entidade de domínio do triagem; é estado operacional
 * do pipeline de upload, no mesmo espírito das tabelas de config do
 * agent-engine (ADR-0007).
 */
export const uploadLoteItens = createTable("upload_lote_itens", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  status: uploadLoteStatusEnum("status").default("pendente").notNull(),
  mensagem: text("mensagem"),
  candidatoId: uuid("candidato_id").references(() => candidatos.id),
  errorType: varchar("error_type", { length: 30 }),
  ...timestamps,
});

export type UploadLoteItem = typeof uploadLoteItens.$inferSelect;
export type NovoUploadLoteItem = typeof uploadLoteItens.$inferInsert;

export const candidatoCertificacoes = createTable(
  "candidato_certificacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => candidatos.id),
    titulo: varchar("titulo", { length: 150 }).notNull(),
    obtidaEm: date("obtida_em", { mode: "string" }),
    validade: date("validade", { mode: "string" }),
    ...timestamps,
  },
  (table) => [
    index("candidato_certificacoes_candidato_id_idx").on(table.candidatoId),
  ],
);

export type CandidatoCertificacao = typeof candidatoCertificacoes.$inferSelect;
export type NovaCandidatoCertificacao =
  typeof candidatoCertificacoes.$inferInsert;

export const triagens = createTable(
  "triagens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vagaId: uuid("vaga_id")
      .notNull()
      .references(() => vagas.id),
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => candidatos.id),
    etapa: triagemEtapaEnum("etapa").notNull(),
    resultado: triagemResultadoEnum("resultado")
      .default("em_andamento")
      .notNull(),
    motivo: triagemMotivoEnum("motivo"),
    parecerRhCurriculo: text("parecer_rh_curriculo"),
    parecerRhTestes: text("parecer_rh_testes"),
    parecerRhEntrevistaRh: text("parecer_rh_entrevista_rh"),
    parecerRhEntrevistaGestor: text("parecer_rh_entrevista_gestor"),
    parecerRhFinalizado: text("parecer_rh_finalizado"),
    ...timestamps,
  },
  (table) => [
    index("triagens_vaga_id_idx").on(table.vagaId),
    index("triagens_candidato_id_idx").on(table.candidatoId),
    uniqueIndex("triagens_candidato_vaga_idx")
      .on(table.candidatoId, table.vagaId)
      .where(
        and(eq(table.resultado, "em_andamento"), isNull(table.deletedAt))!,
      ),
  ],
);

export type Triagem = typeof triagens.$inferSelect;
export type NovaTriagem = typeof triagens.$inferInsert;

export const avaliacaoIA = createTable(
  "avaliacao_ia",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    triagemId: uuid("triagem_id")
      .notNull()
      .references(() => triagens.id)
      .unique(),
    vagaFoiInferida: boolean("vaga_foi_inferida").default(false).notNull(),
    pontosFortes: text("pontos_fortes").notNull(),
    requisitosFaltantes: text("requisitos_faltantes").notNull(),
    eliminatoriosFalhos: text("eliminatorios_falhos").notNull(),
    alertas: text("alertas").notNull(),
    scoreIa: numeric("score_ia", { precision: 5, scale: 2 }).notNull(),
    parecerIa: text("parecer_ia").notNull(),
    ...timestamps,
  },
  (table) => [
    check(
      "avaliacao_ia_score_check",
      sql`${table.scoreIa} >= 0 AND ${table.scoreIa} <= 100`,
    ),
  ],
);

export type AvaliacaoIA = typeof avaliacaoIA.$inferSelect;
export type NovaAvaliacaoIA = typeof avaliacaoIA.$inferInsert;

// ---------------------------------------------------------------------------
// Motor de Agentes IA (ADR-0007) — config e credenciais, não fazem parte do
// domínio de negócio de 9 entidades em docs/db_triagem_proposta.ts.
// ---------------------------------------------------------------------------

export const agenteSlotEnum = pgEnum("agente_slot", [
  "extracao_curriculo",
  "classificador_aderencia",
  "avaliador_triagem",
]);

export const llmCredenciais = createTable("llm_credenciais", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: varchar("provider", { length: 60 }).notNull(),
  apiKeyCifrada: text("api_key_cifrada").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  ...timestamps,
});

export type LlmCredencial = typeof llmCredenciais.$inferSelect;
export type NovaLlmCredencial = typeof llmCredenciais.$inferInsert;

export const agenteConfig = createTable("agente_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  slot: agenteSlotEnum("slot").notNull().unique(),
  provider: varchar("provider", { length: 60 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  systemPrompt: text("system_prompt").notNull(),
  userPrompt: text("user_prompt").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  ...timestamps,
});

export type AgenteConfig = typeof agenteConfig.$inferSelect;
export type NovoAgenteConfig = typeof agenteConfig.$inferInsert;

export const emailCredenciais = createTable("email_credenciais", {
  id: uuid("id").primaryKey().defaultRandom(),
  host: varchar("host", { length: 255 }).notNull(),
  porta: integer("porta").notNull(),
  usuario: varchar("usuario", { length: 254 }).notNull(),
  senhaCifrada: text("senha_cifrada").notNull(),
  pasta: varchar("pasta", { length: 120 }).default("INBOX").notNull(),
  ultimoUidProcessado: bigint("ultimo_uid_processado", { mode: "number" }),
  // Filtro opcional aplicado no próprio IMAP SEARCH (SINCE): quando setado,
  // a captura nunca busca nem processa mensagem anterior a esta data.
  // Combinado com ultimoUidProcessado=0, limita o backfill a uma janela
  // recente em vez de varrer a caixa inteira desde o início.
  capturarDesde: date("capturar_desde", { mode: "string" }),
  ativo: boolean("ativo").default(true).notNull(),
  ...timestamps,
});

export type EmailCredencial = typeof emailCredenciais.$inferSelect;
export type NovaEmailCredencial = typeof emailCredenciais.$inferInsert;

export const departamentosRelations = relations(departamentos, ({ many }) => ({
  cargos: many(cargos),
}));

export const cargosRelations = relations(cargos, ({ one, many }) => ({
  departamento: one(departamentos, {
    fields: [cargos.departamentoId],
    references: [departamentos.id],
  }),
  vagas: many(vagas),
}));

export const vagasRelations = relations(vagas, ({ one, many }) => ({
  cargo: one(cargos, {
    fields: [vagas.cargoId],
    references: [cargos.id],
  }),
  triagens: many(triagens),
  vagaCidades: many(vagaCidades),
}));

export const vagaCidadesRelations = relations(vagaCidades, ({ one }) => ({
  vaga: one(vagas, {
    fields: [vagaCidades.vagaId],
    references: [vagas.id],
  }),
  cidade: one(cidades, {
    fields: [vagaCidades.cidadeId],
    references: [cidades.id],
  }),
}));

export const candidatosRelations = relations(candidatos, ({ one, many }) => ({
  formacoes: many(candidatoFormacoes),
  experiencias: many(candidatoExperiencias),
  certificacoes: many(candidatoCertificacoes),
  triagens: many(triagens),
  cargoInteresse: one(cargos, {
    fields: [candidatos.cargoInteresseId],
    references: [cargos.id],
  }),
  areaInteresse: one(departamentos, {
    fields: [candidatos.areaInteresseId],
    references: [departamentos.id],
  }),
}));

export const candidatoFormacoesRelations = relations(
  candidatoFormacoes,
  ({ one }) => ({
    candidato: one(candidatos, {
      fields: [candidatoFormacoes.candidatoId],
      references: [candidatos.id],
    }),
  }),
);

export const candidatoExperienciasRelations = relations(
  candidatoExperiencias,
  ({ one }) => ({
    candidato: one(candidatos, {
      fields: [candidatoExperiencias.candidatoId],
      references: [candidatos.id],
    }),
  }),
);

export const candidatoCertificacoesRelations = relations(
  candidatoCertificacoes,
  ({ one }) => ({
    candidato: one(candidatos, {
      fields: [candidatoCertificacoes.candidatoId],
      references: [candidatos.id],
    }),
  }),
);

export const triagensRelations = relations(triagens, ({ one }) => ({
  candidato: one(candidatos, {
    fields: [triagens.candidatoId],
    references: [candidatos.id],
  }),
  vaga: one(vagas, {
    fields: [triagens.vagaId],
    references: [vagas.id],
  }),
  avaliacaoIA: one(avaliacaoIA),
}));

export const avaliacaoIARelations = relations(avaliacaoIA, ({ one }) => ({
  triagem: one(triagens, {
    fields: [avaliacaoIA.triagemId],
    references: [triagens.id],
  }),
}));

// ---------------------------------------------------------------------------
// Agregados hidratados (Hydrated Types)
// ---------------------------------------------------------------------------

export interface CandidatoCompleto extends Candidato {
  formacoes: CandidatoFormacao[];
  experiencias: CandidatoExperienciaProfissional[];
  certificacoes: CandidatoCertificacao[];
}

export interface VagaCompleta extends Vaga {
  cidades: Cidade[];
  cargo: Cargo & { departamento: Departamento };
}

export interface TriagemCompleta extends Triagem {
  candidato: Candidato;
  vaga: VagaCompleta;
  avaliacao_ia: AvaliacaoIA | null;
}
