CREATE TYPE "public"."processamento_ia_etapa" AS ENUM('classificador', 'avaliador');--> statement-breakpoint
CREATE TYPE "public"."processamento_ia_fluxo" AS ENUM('candidato_vagas', 'vaga_candidatos');--> statement-breakpoint
CREATE TYPE "public"."processamento_ia_status" AS ENUM('processando', 'sucesso', 'falha');--> statement-breakpoint
CREATE TABLE "wgotalent_processamentos_ia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fluxo" "processamento_ia_fluxo" NOT NULL,
	"etapa" "processamento_ia_etapa" NOT NULL,
	"status" "processamento_ia_status" DEFAULT 'processando' NOT NULL,
	"candidato_id" uuid,
	"vaga_id" uuid,
	"triagem_id" uuid,
	"itens_pendentes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mensagem" text,
	"tentativas" smallint DEFAULT 1 NOT NULL,
	"iniciado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"finalizado_em" timestamp with time zone,
	"retry_solicitado_em" timestamp with time zone,
	"retry_por" varchar(150),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "processamentos_ia_tentativas_check" CHECK ("wgotalent_processamentos_ia"."tentativas" > 0)
);
--> statement-breakpoint
ALTER TABLE "wgotalent_processamentos_ia" ADD CONSTRAINT "wgotalent_processamentos_ia_candidato_id_wgotalent_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."wgotalent_candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wgotalent_processamentos_ia" ADD CONSTRAINT "wgotalent_processamentos_ia_vaga_id_wgotalent_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."wgotalent_vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wgotalent_processamentos_ia" ADD CONSTRAINT "wgotalent_processamentos_ia_triagem_id_wgotalent_triagens_id_fk" FOREIGN KEY ("triagem_id") REFERENCES "public"."wgotalent_triagens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "processamentos_ia_fluxo_created_idx" ON "wgotalent_processamentos_ia" USING btree ("fluxo","created_at");--> statement-breakpoint
CREATE INDEX "processamentos_ia_status_idx" ON "wgotalent_processamentos_ia" USING btree ("status");--> statement-breakpoint
CREATE INDEX "processamentos_ia_triagem_id_idx" ON "wgotalent_processamentos_ia" USING btree ("triagem_id");