CREATE TABLE "wgotalent_candidatos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(150) NOT NULL,
	"nome_social" varchar(150),
	"nacionalidade" varchar(60) DEFAULT 'brasileira',
	"data_nascimento" date,
	"estado_civil" "estado_civil" DEFAULT 'nao_informado',
	"pcd" text,
	"email" varchar(254) NOT NULL,
	"celular" varchar(20) NOT NULL,
	"cep" varchar(9),
	"uf" char(2),
	"cidade" varchar(100),
	"bairro" varchar(100),
	"logradouro" varchar(200),
	"resumo_profissional" text,
	"cnh" "cnh",
	"possui_veiculo" boolean DEFAULT false NOT NULL,
	"ensino_medio_concluido" boolean DEFAULT false NOT NULL,
	"cargo_interesse_id" uuid,
	"area_interesse_id" uuid,
	"disponivel_viagens" boolean DEFAULT false NOT NULL,
	"disponivel_mudanca" boolean DEFAULT false NOT NULL,
	"disponibilidade_horarios" text,
	"inicio_imediato" boolean DEFAULT false NOT NULL,
	"linkedin" varchar(255),
	"portfolio" varchar(255),
	"origem" "origem" DEFAULT 'manual' NOT NULL,
	"curriculo_arquivo_key" text,
	"texto_curriculo_extraido" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "wgotalent_candidatos_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ADD CONSTRAINT "wgotalent_candidatos_cargo_interesse_id_wgotalent_cargos_id_fk" FOREIGN KEY ("cargo_interesse_id") REFERENCES "public"."wgotalent_cargos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ADD CONSTRAINT "wgotalent_candidatos_area_interesse_id_wgotalent_departamentos_id_fk" FOREIGN KEY ("area_interesse_id") REFERENCES "public"."wgotalent_departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidatos_cargo_interesse_id_idx" ON "wgotalent_candidatos" USING btree ("cargo_interesse_id");--> statement-breakpoint
CREATE INDEX "candidatos_area_interesse_id_idx" ON "wgotalent_candidatos" USING btree ("area_interesse_id");