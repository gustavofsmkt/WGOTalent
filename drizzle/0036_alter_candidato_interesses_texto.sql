ALTER TABLE "wgotalent_candidatos" DROP CONSTRAINT "wgotalent_candidatos_cargo_interesse_id_wgotalent_cargos_id_fk";
--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" DROP CONSTRAINT "wgotalent_candidatos_area_interesse_id_wgotalent_departamentos_id_fk";
--> statement-breakpoint
DROP INDEX "candidatos_cargo_interesse_id_idx";--> statement-breakpoint
DROP INDEX "candidatos_area_interesse_id_idx";--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ADD COLUMN "cargo_interesse" varchar(150);--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" ADD COLUMN "area_interesse" varchar(120);--> statement-breakpoint
UPDATE "wgotalent_candidatos" AS "candidato"
SET "cargo_interesse" = "cargo"."titulo"
FROM "wgotalent_cargos" AS "cargo"
WHERE "candidato"."cargo_interesse_id" = "cargo"."id";--> statement-breakpoint
UPDATE "wgotalent_candidatos" AS "candidato"
SET "area_interesse" = "departamento"."nome"
FROM "wgotalent_departamentos" AS "departamento"
WHERE "candidato"."area_interesse_id" = "departamento"."id";--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" DROP COLUMN "cargo_interesse_id";--> statement-breakpoint
ALTER TABLE "wgotalent_candidatos" DROP COLUMN "area_interesse_id";--> statement-breakpoint

-- O prompt é configuração persistida. Atualiza apenas o slot ativo e mantém
-- intactas as customizações que não pertencem aos campos de interesse.
UPDATE "wgotalent_agente_config"
SET "system_prompt" = replace(
  replace(
    "system_prompt",
    'dados pessoais, de contato e de cidade',
    'dados pessoais, de contato, de cidade, de cargo e de área de interesse'
  ),
  $old$# Perfil
- cnh:$old$,
  $new$# Perfil
- cargoInteresse: cargo ou função que o candidato declara querer exercer, inclusive quando vier no e-mail de candidatura como vaga de interesse. Registre um único título, em até 150 caracteres. Não use automaticamente o cargo atual ou cargos anteriores como interesse. Nunca derive cargoInteresse apenas da área, formação ou experiência. Sem objetivo/cargo desejado explícito -> null.
- areaInteresse: área profissional declarada pelo candidato. Quando ela não estiver declarada e cargoInteresse não for null, derive uma área ampla e direta do cargo desejado (ex.: "Auxiliar Administrativo" -> "Administrativo"). A área pode ser derivada do cargo; o cargo nunca pode ser derivado da área. Sem área declarada e sem cargoInteresse -> null.
- cnh:$new$
)
WHERE "slot" = 'extracao_curriculo'
  AND "deleted_at" IS NULL;
