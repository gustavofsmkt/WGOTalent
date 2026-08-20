ALTER TABLE "wgotalent_triagens" DROP COLUMN "parecer_rh";--> statement-breakpoint
ALTER TABLE "wgotalent_triagens" DROP COLUMN "parecer_rh_data";--> statement-breakpoint
ALTER TABLE "wgotalent_triagens" ADD COLUMN "parecer_rh_curriculo" text;--> statement-breakpoint
ALTER TABLE "wgotalent_triagens" ADD COLUMN "parecer_rh_testes" text;--> statement-breakpoint
ALTER TABLE "wgotalent_triagens" ADD COLUMN "parecer_rh_entrevista_rh" text;--> statement-breakpoint
ALTER TABLE "wgotalent_triagens" ADD COLUMN "parecer_rh_entrevista_gestor" text;--> statement-breakpoint
ALTER TABLE "wgotalent_triagens" ADD COLUMN "parecer_rh_finalizado" text;
