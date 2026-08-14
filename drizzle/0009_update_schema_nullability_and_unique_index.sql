DROP INDEX "triagens_candidato_vaga_ativa_idx";--> statement-breakpoint
ALTER TABLE "wgotalent_avaliacao_ia" ALTER COLUMN "pontos_fortes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_avaliacao_ia" ALTER COLUMN "requisitos_faltantes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_avaliacao_ia" ALTER COLUMN "eliminatorios_falhos" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_avaliacao_ia" ALTER COLUMN "alertas" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_avaliacao_ia" ALTER COLUMN "score_ia" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_avaliacao_ia" ALTER COLUMN "parecer_ia" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidato_formacoes" ALTER COLUMN "data_inicio" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "nacionalidade" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "data_nascimento" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "estado_civil" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "cep" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "uf" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "cidade" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "bairro" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "logradouro" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "resumo_profissional" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_cargos" ALTER COLUMN "descricao" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_cargos" ALTER COLUMN "requisitos" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_cargos" ALTER COLUMN "requisitos_desejaveis" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_cargos" ALTER COLUMN "criterios_eliminatorios" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_departamentos" ALTER COLUMN "descricao" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "triagens_candidato_vaga_idx" ON "wgotalent_triagens" USING btree ("candidato_id","vaga_id");