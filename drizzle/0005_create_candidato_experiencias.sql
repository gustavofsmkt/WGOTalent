CREATE TABLE "wgotalent_candidato_experiencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidato_id" uuid NOT NULL,
	"empresa" varchar(150),
	"cargo_titulo" varchar(150) NOT NULL,
	"descricao" text,
	"data_entrada" date NOT NULL,
	"data_saida" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wgotalent_candidato_experiencias" ADD CONSTRAINT "wgotalent_candidato_experiencias_candidato_id_wgotalent_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."wgotalent_candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidato_experiencias_candidato_id_idx" ON "wgotalent_candidato_experiencias" USING btree ("candidato_id");