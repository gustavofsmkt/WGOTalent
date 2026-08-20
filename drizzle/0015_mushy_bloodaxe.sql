CREATE TYPE "public"."upload_lote_status" AS ENUM('pendente', 'processando', 'sucesso', 'erro');--> statement-breakpoint
CREATE TABLE "wgotalent_upload_lote_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"status" "upload_lote_status" DEFAULT 'pendente' NOT NULL,
	"mensagem" text,
	"candidato_id" uuid,
	"error_type" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wgotalent_upload_lote_itens" ADD CONSTRAINT "wgotalent_upload_lote_itens_candidato_id_wgotalent_candidatos_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."wgotalent_candidatos"("id") ON DELETE no action ON UPDATE no action;