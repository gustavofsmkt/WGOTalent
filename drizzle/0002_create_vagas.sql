CREATE TABLE "wgotalent_vagas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "status_vaga" DEFAULT 'aberta' NOT NULL,
	"posicoes_disponiveis" smallint DEFAULT 1 NOT NULL,
	"cargo_id" uuid NOT NULL,
	"remuneracao_oferecida" numeric(10, 2),
	"cidade" varchar(100) NOT NULL,
	"uf" char(2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "vagas_posicoes_disponiveis_check" CHECK ("wgotalent_vagas"."posicoes_disponiveis" > 0)
);
--> statement-breakpoint
ALTER TABLE "wgotalent_vagas" ADD CONSTRAINT "wgotalent_vagas_cargo_id_wgotalent_cargos_id_fk" FOREIGN KEY ("cargo_id") REFERENCES "public"."wgotalent_cargos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vagas_cargo_id_idx" ON "wgotalent_vagas" USING btree ("cargo_id");