ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "possui_veiculo" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "possui_veiculo" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "ensino_medio_concluido" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "ensino_medio_concluido" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "disponivel_viagens" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "disponivel_viagens" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "disponivel_mudanca" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "disponivel_mudanca" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "inicio_imediato" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "inicio_imediato" DROP NOT NULL;