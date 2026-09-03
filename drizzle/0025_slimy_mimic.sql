CREATE TABLE "wgotalent_vaga_cidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vaga_id" uuid NOT NULL,
	"cidade_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wgotalent_vaga_cidades" ADD CONSTRAINT "wgotalent_vaga_cidades_vaga_id_wgotalent_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."wgotalent_vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wgotalent_vaga_cidades" ADD CONSTRAINT "wgotalent_vaga_cidades_cidade_id_wgotalent_cidades_id_fk" FOREIGN KEY ("cidade_id") REFERENCES "public"."wgotalent_cidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vaga_cidades_vaga_id_idx" ON "wgotalent_vaga_cidades" USING btree ("vaga_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vaga_cidades_vaga_cidade_idx" ON "wgotalent_vaga_cidades" USING btree ("vaga_id","cidade_id") WHERE "wgotalent_vaga_cidades"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "wgotalent_vagas" DROP COLUMN "cidade";--> statement-breakpoint
ALTER TABLE "wgotalent_vagas" DROP COLUMN "uf";