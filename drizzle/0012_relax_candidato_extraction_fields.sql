ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "data_nascimento" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "cep" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "bairro" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "logradouro" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ADD COLUMN "dados_pendentes" text;