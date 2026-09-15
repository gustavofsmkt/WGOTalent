import * as React from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "~/components/page-header";
import { BackButton } from "~/components/back-button";
import { CandidatoBaseForm } from "~/components/candidato-form";
import { candidatoRepository } from "~/server/db/repositories/candidato";

export const dynamic = "force-dynamic";

interface EditarCandidatoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: EditarCandidatoPageProps) {
  const { id } = await props.params;
  const candidato = await candidatoRepository.findById(id);

  if (!candidato) {
    return {
      title: "Candidato não encontrado | WGOTalent",
    };
  }

  return {
    title: `Editar ${candidato.nome} | Candidatos | WGOTalent`,
    description: `Edição dos dados cadastrais de ${candidato.nome}.`,
  };
}

export default async function EditarCandidatoPage(
  props: EditarCandidatoPageProps,
) {
  const { id } = await props.params;
  const [candidato, activeCargoOptions, activeDepartamentoOptions] =
    await Promise.all([
      candidatoRepository.findByIdComplete(id),
      candidatoRepository.findActiveCargoOptions(),
      candidatoRepository.findActiveDepartamentoOptions(),
    ]);

  if (!candidato) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref={`/candidatos/${candidato.id}`}>
          Voltar
        </BackButton>
      </div>

      <PageHeader
        title="Editar Candidato"
        description={`Atualize as informações, histórico profissional e preferências de ${candidato.nome}.`}
      />

      <div className="flex justify-center">
        <CandidatoBaseForm
          candidato={candidato}
          cargoOptions={activeCargoOptions}
          departamentoOptions={activeDepartamentoOptions}
          redirectTo={`/candidatos/${candidato.id}`}
          className="w-full"
        />
      </div>
    </div>
  );
}
