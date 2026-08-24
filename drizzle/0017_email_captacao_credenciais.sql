CREATE TABLE "wgotalent_email_credenciais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host" varchar(255) NOT NULL,
	"porta" integer NOT NULL,
	"usuario" varchar(254) NOT NULL,
	"senha_cifrada" text NOT NULL,
	"pasta" varchar(120) DEFAULT 'INBOX' NOT NULL,
	"ultimo_uid_processado" bigint,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
