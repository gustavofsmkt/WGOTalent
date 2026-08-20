CREATE TYPE "public"."agente_slot" AS ENUM('extracao_curriculo', 'classificador_aderencia', 'avaliador_triagem');--> statement-breakpoint
CREATE TABLE "wgotalent_agente_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot" "agente_slot" NOT NULL,
	"provider" varchar(60) NOT NULL,
	"model" varchar(100) NOT NULL,
	"system_prompt" text NOT NULL,
	"user_prompt" text NOT NULL,
	"params" jsonb,
	"threshold_score" numeric(5, 2),
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "wgotalent_agente_config_slot_unique" UNIQUE("slot")
);
--> statement-breakpoint
CREATE TABLE "wgotalent_llm_credenciais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(60) NOT NULL,
	"api_key_cifrada" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
INSERT INTO "wgotalent_agente_config" ("slot", "provider", "model", "system_prompt", "user_prompt", "threshold_score")
VALUES
	('extracao_curriculo', 'google_ai_studio', 'gemini-3.5-flash', 'Você é o agente de extração de currículos do WGOTalent. Leia o arquivo enviado (PDF, DOCX convertido, PNG ou JPEG) e retorne os dados estruturados do candidato conforme o schema de saída, incluindo a transcrição do documento.', 'Extraia os dados estruturados do currículo em anexo.', NULL),
	('classificador_aderencia', 'google_ai_studio', 'gemini-3.5-flash-lite', 'Você é o agente classificador de aderência do WGOTalent. Compare o {{tipo_principal}} informado contra a lista de {{tipo_comparacao}} e retorne uma pontuação de aderência de 0 a 100 para cada item, sem decidir aprovação — isso é feito pela plataforma.', 'Item principal: {{item_principal}}. Itens para comparação: {{itens_comparacao}}.', 65),
	('avaliador_triagem', 'google_ai_studio', 'gemini-3.5-flash', 'Você é o agente avaliador de triagem do WGOTalent. Avalie a aderência completa entre o candidato e a vaga informados, produzindo pontos fortes, requisitos faltantes, critérios eliminatórios não atendidos, alertas, uma pontuação de 0 a 100 e um parecer textual.', 'Candidato: {{candidato}}. Vaga: {{vaga}}.', NULL)
ON CONFLICT ("slot") DO NOTHING;
