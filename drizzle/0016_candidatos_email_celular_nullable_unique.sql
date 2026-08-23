ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "wgotalent_candidatos" ALTER COLUMN "celular" DROP NOT NULL;
ALTER TABLE "wgotalent_candidatos"
  ADD CONSTRAINT "wgotalent_candidatos_celular_unique" UNIQUE("celular");
