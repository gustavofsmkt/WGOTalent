CREATE TYPE "public"."cnh" AS ENUM('a', 'b', 'ab', 'c', 'd', 'e');--> statement-breakpoint
CREATE TYPE "public"."estado_civil" AS ENUM('nao_informado', 'solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel');--> statement-breakpoint
CREATE TYPE "public"."origem" AS ENUM('email', 'manual', 'indicacao');--> statement-breakpoint
CREATE TYPE "public"."status_vaga" AS ENUM('aberta', 'concluida', 'cancelada', 'pausada', 'incompleta');--> statement-breakpoint
CREATE TYPE "public"."triagem_etapa" AS ENUM('curriculo', 'testes', 'entrevista_rh', 'entrevista_gestor', 'finalizado');--> statement-breakpoint
CREATE TYPE "public"."triagem_motivo" AS ENUM('curriculo', 'fit_cultural', 'testes', 'rh', 'gestor', 'incompatibilidade_salarial', 'aceitou_outra_proposta', 'nao_atendeu_contato', 'motivos_pessoais');--> statement-breakpoint
CREATE TYPE "public"."triagem_resultado" AS ENUM('em_andamento', 'aprovado', 'reprovado', 'desistente', 'banco_talentos');--> statement-breakpoint
CREATE TABLE "wgotalent_departamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(120) NOT NULL,
	"descricao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "wgotalent_departamentos_nome_unique" UNIQUE("nome")
);
