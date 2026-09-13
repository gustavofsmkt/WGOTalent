ALTER TABLE "wgotalent_agente_config" ADD COLUMN "credencial_id" uuid;--> statement-breakpoint
ALTER TABLE "wgotalent_llm_credenciais" ADD COLUMN "nome" varchar(120);--> statement-breakpoint
-- Backfill: credenciais existentes eram identificadas apenas pelo provider.
UPDATE "wgotalent_llm_credenciais" SET "nome" = "provider" WHERE "nome" IS NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_llm_credenciais" ALTER COLUMN "nome" SET NOT NULL;--> statement-breakpoint
-- Backfill: liga cada agente à credencial ativa mais recente do seu provider.
UPDATE "wgotalent_agente_config" AS ac
SET "credencial_id" = (
  SELECT c."id"
  FROM "wgotalent_llm_credenciais" AS c
  WHERE c."provider" = ac."provider"
    AND c."ativo" = true
    AND c."deleted_at" IS NULL
  ORDER BY c."created_at" DESC
  LIMIT 1
)
WHERE ac."credencial_id" IS NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_agente_config" ADD CONSTRAINT "wgotalent_agente_config_credencial_id_wgotalent_llm_credenciais_id_fk" FOREIGN KEY ("credencial_id") REFERENCES "public"."wgotalent_llm_credenciais"("id") ON DELETE no action ON UPDATE no action;
