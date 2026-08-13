CREATE TABLE "wgotalent_triagens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vaga_id" uuid NOT NULL,
	"candidato_id" uuid NOT NULL,
	"etapa" "triagem_etapa" NOT NULL,
	"resultado" "triagem_resultado" DEFAULT 'em_andamento' NOT NULL,
	"motivo" "triagem_motivo",
	"parecer_rh" text,
	"parecer_rh_data" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wgotalent_triagens" ADD CONSTRAINT "wgotalent_triagens_vaga_id_wgotalent_vagas_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."wgotalent_vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wgotalent_triagens" ADD CONSTRAINT "wgotalent_triagens_candidato_id_wgotalent_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."wgotalent_candidatos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "triagens_vaga_id_idx" ON "wgotalent_triagens" USING btree ("vaga_id");--> statement-breakpoint
CREATE INDEX "triagens_candidato_id_idx" ON "wgotalent_triagens" USING btree ("candidato_id");--> statement-breakpoint
CREATE UNIQUE INDEX "triagens_candidato_vaga_ativa_idx" ON "wgotalent_triagens" USING btree ("candidato_id","vaga_id") WHERE "wgotalent_triagens"."resultado" = 'em_andamento';