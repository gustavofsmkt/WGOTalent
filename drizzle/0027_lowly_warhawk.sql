ALTER TYPE "public"."processamento_ia_etapa" ADD VALUE 'extracao';--> statement-breakpoint
ALTER TYPE "public"."processamento_ia_fluxo" ADD VALUE 'ingestao_curriculo';--> statement-breakpoint
ALTER TABLE "wgotalent_processamentos_ia" ADD COLUMN "arquivo_key" text;