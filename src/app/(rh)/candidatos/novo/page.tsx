import * as React from "react";
import { PageHeader } from "~/components/page-header";
import { BackButton } from "~/components/back-button";
import { CandidatoBaseForm } from "~/components/candidato-form";
import { candidatoRepository } from "~/server/db/repositories/candidato";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Novo Candidato | WGOTalent",
  description: "Cadastre um novo candidato manualmente no sistema.",
};

export default async function NovoCandidatoPage() {
  const [cargoOptions, departamentoOptions] = await Promise.all([
    candidatoRepository.findActiveCargoOptions(),
    candidatoRepository.findActiveDepartamentoOptions(),
  ]);

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/candidatos">Voltar</BackButton>
      </div>

      <PageHeader
        title="Novo Candidato"
        description="Cadastre as informações completas, experiências, formações e preferências do profissional."
      />

      <CandidatoBaseForm
        cargoOptions={cargoOptions}
        departamentoOptions={departamentoOptions}
      />
    </div>
  );
}
