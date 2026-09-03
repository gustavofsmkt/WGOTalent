ALTER TABLE "wgotalent_vagas" ADD COLUMN "nota_corte" numeric(5, 2) DEFAULT '65.00' NOT NULL;--> statement-breakpoint
UPDATE "wgotalent_vagas"
SET "nota_corte" = LEAST(
	100,
	GREATEST(
		0,
		COALESCE(
			(
				SELECT "threshold_score"
				FROM "wgotalent_agente_config"
				WHERE "slot" = 'classificador_aderencia'
					AND "deleted_at" IS NULL
				LIMIT 1
			),
			65
		)
	)
);--> statement-breakpoint
ALTER TABLE "wgotalent_agente_config" DROP COLUMN "threshold_score";--> statement-breakpoint
ALTER TABLE "wgotalent_vagas" ADD CONSTRAINT "vagas_nota_corte_check" CHECK ("wgotalent_vagas"."nota_corte" >= 0 AND "wgotalent_vagas"."nota_corte" <= 100);
