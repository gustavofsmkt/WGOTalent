-- Adds support for multiple cities per job opening.
-- Creates vaga_cidades join table, migrates existing cidade/uf data,
-- and drops the old single-city columns from vagas.

CREATE TABLE "wgotalent_vaga_cidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vaga_id" uuid NOT NULL,
	"cidade_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wgotalent_vaga_cidades" ADD CONSTRAINT "wgotalent_vaga_cidades_vaga_id_wgotalent_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."wgotalent_vagas"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wgotalent_vaga_cidades" ADD CONSTRAINT "wgotalent_vaga_cidades_cidade_id_wgotalent_cidades_id_fk" FOREIGN KEY ("cidade_id") REFERENCES "public"."wgotalent_cidades"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "vaga_cidades_vaga_id_idx" ON "wgotalent_vaga_cidades" USING btree ("vaga_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "vaga_cidades_vaga_cidade_idx" ON "wgotalent_vaga_cidades" USING btree ("vaga_id","cidade_id") WHERE "deleted_at" IS NULL;
--> statement-breakpoint

-- Ensure cidades referenced by existing vagas exist in wgotalent_cidades
INSERT INTO "wgotalent_cidades" ("nome", "uf")
SELECT DISTINCT v.cidade, v.uf
FROM "wgotalent_vagas" v
WHERE v.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "wgotalent_cidades" c
    WHERE c.nome = v.cidade AND c.uf = v.uf
  );
--> statement-breakpoint

-- Migrate existing vaga→cidade associations to the join table
INSERT INTO "wgotalent_vaga_cidades" ("vaga_id", "cidade_id")
SELECT v.id, c.id
FROM "wgotalent_vagas" v
JOIN "wgotalent_cidades" c ON c.nome = v.cidade AND c.uf = v.uf
WHERE v.deleted_at IS NULL;
--> statement-breakpoint

-- Drop the old single-city columns
ALTER TABLE "wgotalent_vagas" DROP COLUMN "cidade";
--> statement-breakpoint
ALTER TABLE "wgotalent_vagas" DROP COLUMN "uf";
