CREATE TABLE "wgotalent_cargos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"departamento_id" uuid NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"faixa_salarial" numeric(10, 2),
	"requisitos" text,
	"requisitos_desejaveis" text,
	"criterios_eliminatorios" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wgotalent_cargos" ADD CONSTRAINT "wgotalent_cargos_departamento_id_wgotalent_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."wgotalent_departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cargos_departamento_id_idx" ON "wgotalent_cargos" USING btree ("departamento_id");