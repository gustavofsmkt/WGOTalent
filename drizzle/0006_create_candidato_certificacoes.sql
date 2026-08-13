CREATE TABLE "wgotalent_candidato_certificacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidato_id" uuid NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"obtida_em" date,
	"validade" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wgotalent_candidato_certificacoes" ADD CONSTRAINT "wgotalent_candidato_certificacoes_candidato_id_wgotalent_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."wgotalent_candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidato_certificacoes_candidato_id_idx" ON "wgotalent_candidato_certificacoes" USING btree ("candidato_id");