CREATE TABLE "wgotalent_candidato_formacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidato_id" uuid NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"instituicao" varchar(150),
	"area_formacao" varchar(120) NOT NULL,
	"data_inicio" date,
	"data_termino" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wgotalent_candidato_formacoes" ADD CONSTRAINT "wgotalent_candidato_formacoes_candidato_id_wgotalent_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."wgotalent_candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidato_formacoes_candidato_id_idx" ON "wgotalent_candidato_formacoes" USING btree ("candidato_id");