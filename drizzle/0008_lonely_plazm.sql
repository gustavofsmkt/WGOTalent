CREATE TABLE "wgotalent_avaliacao_ia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"triagem_id" uuid NOT NULL,
	"vaga_foi_inferida" boolean DEFAULT false NOT NULL,
	"pontos_fortes" text,
	"requisitos_faltantes" text,
	"eliminatorios_falhos" text,
	"alertas" text,
	"score_ia" numeric(5, 2),
	"parecer_ia" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "wgotalent_avaliacao_ia_triagem_id_unique" UNIQUE("triagem_id"),
	CONSTRAINT "avaliacao_ia_score_check" CHECK ("wgotalent_avaliacao_ia"."score_ia" >= 0 AND "wgotalent_avaliacao_ia"."score_ia" <= 100)
);
--> statement-breakpoint
ALTER TABLE "wgotalent_avaliacao_ia" ADD CONSTRAINT "wgotalent_avaliacao_ia_triagem_id_wgotalent_triagens_id_fk" FOREIGN KEY ("triagem_id") REFERENCES "public"."wgotalent_triagens"("id") ON DELETE no action ON UPDATE no action;