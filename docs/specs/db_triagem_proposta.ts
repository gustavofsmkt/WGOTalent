// Soft delete em todas as entidades via `deleted_at` (TIMESTAMPTZ, nullable, default null).
// Toda query de leitura deve filtrar `WHERE deleted_at IS NULL` (ou view/helper equivalente).
// IMPORTANTE: como é soft delete, cascade NÃO pode depender de `ON DELETE CASCADE` do Postgres
// (que só dispara em DELETE real). O cascade de Candidato -> Formacao/Experiencia/Certificacao/Triagem
// precisa ser feito na camada de aplicação (ou trigger) que também seta `deleted_at` nas filhas.
 
// ---------------------------------------------------------------------------
// departamentos
// ---------------------------------------------------------------------------
 
export interface Departamento {
  id: string;               			// uuid, PK
  created_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  deleted_at: string | null;			// TIMESTAMPTZ, NULL = ativo
 
  nome: string;             			// VARCHAR(120) UNIQUE NOT NULL
  descricao: string;        			// TEXT
}
 
// --------------------------------------------------------------------------
// cargos
// ---------------------------------------------------------------------------
 
export interface Cargo {
  id: string;                        	// uuid, PK
  created_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  deleted_at: string | null;			// TIMESTAMPTZ, NULL = ativo
 
  departamento_id: string;            	// uuid, FK -> Departamento.id, NOT NULL, INDEXED
 
  titulo: string;                       // VARCHAR(150) NOT NULL
  descricao: string;                    // TEXT
  ativo: boolean;                       // NOT NULL DEFAULT true
 
  faixa_salarial: number | null;        // NUMERIC(10,2)
 
  requisitos: string;                   // TEXT
  requisitos_desejaveis: string;        // TEXT
  criterios_eliminatorios: string;      // TEXT
}
 
// ---------------------------------------------------------------------------
// vagas
// ---------------------------------------------------------------------------
 
export interface Vaga {
  id: string;                  			// uuid, PK
  created_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  deleted_at: string | null;			// TIMESTAMPTZ, NULL = ativo
 
  status: "aberta" | "concluida" | "cancelada" | "pausada" | "incompleta"; // renomeado de status_id (não é FK)
  posicoes_disponiveis: number;    		// SMALLINT NOT NULL DEFAULT 1, CHECK (> 0)
 
  cargo_id: string;             		// uuid, FK -> Cargo.id, NOT NULL, INDEXED
  remuneracao_oferecida: number | null; // NUMERIC(10,2)
 
  cidade: string;                		// VARCHAR(100) NOT NULL
  uf: string;                     		// CHAR(2) NOT NULL
}
 
// ---------------------------------------------------------------------------
// candidatos
// ---------------------------------------------------------------------------
 
export interface Candidato {
  id: string;                    		// uuid, PK
  created_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  deleted_at: string | null;			// TIMESTAMPTZ, NULL = ativo
 
  nome: string;                    		// VARCHAR(150) NOT NULL
  nome_social: string | null;       	// VARCHAR(150)
  nacionalidade: string;                // VARCHAR(60) DEFAULT 'brasileira'
  data_nascimento: string;              // DATE
  estado_civil: "nao_informado" | "solteiro" | "casado" | "divorciado" | "viuvo" | "uniao_estavel";
  pcd: string | null;                   // TEXT, NULL = não é PCD
 
  email: string;                     	// VARCHAR(254) UNIQUE NOT NULL
  celular: string;                   	// VARCHAR(20) NOT NULL
 
  cep: string;                          // VARCHAR(9)
  uf: string;                           // CHAR(2)
  cidade: string;                       // VARCHAR(100)
  bairro: string;                       // VARCHAR(100)
  logradouro: string;                   // VARCHAR(200)
 
  resumo_profissional: string;          // TEXT (AI-generated)
 
  cnh: null | "a" | "b" | "ab" | "c" | "d" | "e";
  possui_veiculo: boolean;              // NOT NULL DEFAULT false
 
  ensino_medio_concluido: boolean;      // NOT NULL DEFAULT false
 
  cargo_interesse_id: string | null;    // uuid, FK -> Cargo.id, INDEXED, NULL = sem preferência
  area_interesse_id: string | null;     // uuid, FK -> Departamento.id, INDEXED, NULL = sem preferência
 
  disponivel_viagens: boolean;          // NOT NULL DEFAULT false
  disponivel_mudanca: boolean;          // NOT NULL DEFAULT false
  disponibilidade_horarios: boolean;    // NOT NULL DEFAULT false
  inicio_imediato: boolean;             // NOT NULL DEFAULT false
 
  linkedin: string | null;              // VARCHAR(255)
  portfolio: string | null;             // VARCHAR(255)
 
  origem: "email" | "manual" | "indicacao"; // VARCHAR NOT NULL DEFAULT 'manual' — como o candidato entrou no sistema
 
  curriculo_arquivo_key: string | null; // TEXT — chave/caminho no StorageProvider, NÃO é URL pública
  texto_curriculo_extraido: string;     // TEXT // precisamos?
}
 
// ---------------------------------------------------------------------------
// candidato_formacoes  — relacionamento entre candidato e formações acadêmicas (1:N)
// ---------------------------------------------------------------------------
 
export interface CandidatoFormacao {
  id: string;                   		// uuid, PK
  created_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  deleted_at: string | null;			// TIMESTAMPTZ, NULL = ativo. Cascateia quando Candidato é soft-deletado
 
  candidato_id: string;          		// uuid, FK -> Candidato.id, NOT NULL, INDEXED
 
  titulo: string;                 		// VARCHAR(150) NOT NULL
  instituicao: string | null;      		// VARCHAR(150)
  area_formacao: string;            	// VARCHAR(120) NOT NULL
  data_inicio: string;                  // DATE
  data_termino: string | null;       	// DATE (NULL = ongoing)
}
 
// ---------------------------------------------------------------------------
// candidato_experiencias  — relacionamento entre candidato e experiências profissionais (1:N)
// ---------------------------------------------------------------------------
 
export interface CandidatoExperienciaProfissional {
  id: string;               			// uuid, PK
  created_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  deleted_at: string | null;			// TIMESTAMPTZ, NULL = ativo. Cascateia quando Candidato é soft-deletado
 
  candidato_id: string;       			// uuid, FK -> Candidato.id, NOT NULL, INDEXED
 
  empresa: string | null;       		// VARCHAR(150)
  cargo_titulo: string;        			// VARCHAR(150) NOT NULL
  descricao: string | null;          	// TEXT - descrição feita pelo candidato
 
  data_entrada: string;          		// DATE NOT NULL
  data_saida: string | null;      		// DATE (NULL = current role)
}
 
// ---------------------------------------------------------------------------
// candidato_certificacoes - relacionamento entre candidato e certificações (1:N)
// ---------------------------------------------------------------------------
 
export interface CandidatoCertificacao {
  id: string;                  			// uuid, PK
  created_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  deleted_at: string | null;			// TIMESTAMPTZ, NULL = ativo. Cascateia quando Candidato é soft-deletado
 
  candidato_id: string;         		// uuid, FK -> Candidato.id, NOT NULL, INDEXED
 
  titulo: string;               		// VARCHAR(150) NOT NULL
  obtida_em: string | null;      		// DATE
  validade: string | null;         		// DATE
}
 
// ---------------------------------------------------------------------------
// triagens  —  relacionamento entre candidato e vaga (1:N), com status do processo seletivo.
// Status do Candidato = etapa/resultado da triagem mais recente.
//
// `etapa` = em que fase do funil a triagem está.
// `resultado` = desfecho (só relevante quando etapa = 'finalizado', ou em qualquer momento
//   se o candidato desistir no meio do processo).
// `motivo` = detalhe do resultado, obrigatório quando resultado = 'reprovado' ou 'desistente',
//   NULL nos demais casos. Valores consistentes (sem prefixo) para permitir filtro direto por motivo.
//
// Constraint (aplicação ou partial index): motivo só pode ser um valor de reprovação quando
// resultado = 'reprovado', e um valor de desistência quando resultado = 'desistente'.
//
// Partial unique index: impede duas triagens ativas simultâneas do mesmo candidato para a mesma vaga.
//   UNIQUE (candidato_id, vaga_id) WHERE resultado = 'em_andamento'
// ---------------------------------------------------------------------------
 
export interface Triagem {
  id: string;                    		// uuid, PK
  created_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
  deleted_at: string | null;			// TIMESTAMPTZ, NULL = ativo. Cascateia quando Candidato é soft-deletado
 
  vaga_id: string;                 		// uuid, FK -> Vaga.id, NOT NULL, INDEXED
  candidato_id: string;             	// uuid, FK -> Candidato.id, NOT NULL, INDEXED
 
  etapa: "curriculo" | "testes" | "entrevista_rh" | "entrevista_gestor" | "finalizado";
  resultado: "em_andamento" | "aprovado" | "reprovado" | "desistente" | "banco_talentos";
  motivo:
    | null
    // reprovado
    | "curriculo"
    | "fit_cultural"
    | "testes"
    | "rh"
    | "gestor"
    // desistente
    | "incompatibilidade_salarial"
    | "aceitou_outra_proposta"
    | "nao_atendeu_contato"
    | "motivos_pessoais";
 
  parecer_rh: string | null;          	// TEXT, null = sem parecer
  parecer_rh_data: string | null;     	// TIMESTAMPTZ, null = sem parecer
}
 
// ---------------------------------------------------------------------------
// avaliacao_ia  —  avaliação do candidato pela IA, vinculada à triagem (1:1)
// ---------------------------------------------------------------------------
 
export interface AvaliacaoIA {
	id: string;                    		// uuid, PK
	created_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
	updated_at: string;					// TIMESTAMPTZ NOT NULL DEFAULT now()
	deleted_at: string | null;			// TIMESTAMPTZ, NULL = ativo
 
	triagem_id: string;             	// uuid, FK -> Triagem.id, NOT NULL, UNIQUE, INDEXED
 
	vaga_foi_inferida: boolean;
 
	pontos_fortes: string;				// TEXT
	requisitos_faltantes: string;		// TEXT
	eliminatorios_falhos: string;		// TEXT
	alertas: string;					// TEXT
 
	score_ia: number;                  	// NUMERIC(5,2), CHECK (0 <= score_ia <= 100)
	parecer_ia: string;                 // TEXT
}
 
// ---------------------------------------------------------------------------
// Agregados hidratados
// ---------------------------------------------------------------------------
 
export interface CandidatoCompleto extends Candidato {
  formacoes: CandidatoFormacao[];
  experiencias: CandidatoExperienciaProfissional[];
  certificacoes: CandidatoCertificacao[];
}
 
export interface VagaCompleta extends Vaga {
  cargo: Cargo & { departamento: Departamento };
}
 
export interface TriagemCompleta extends Triagem {
  candidato: Candidato;
  vaga: VagaCompleta;
  avaliacao_ia: AvaliacaoIA | null;
}
