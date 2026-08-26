import * as React from "react";
import { notFound } from "next/navigation";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { CandidateHeader } from "./_components/candidate-header";
import { CandidatePersonalInfo } from "./_components/candidate-personal-info";
import { CandidatePreferences } from "./_components/candidate-preferences";
import { CandidateEducation } from "./_components/candidate-education";
import { CandidateExperience } from "./_components/candidate-experience";
import { CandidateCertifications } from "./_components/candidate-certifications";
import { CandidateScreenings } from "./_components/candidate-screenings";

export const dynamic = "force-dynamic";

interface CandidatoDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: CandidatoDetailPageProps) {
  const { id } = await props.params;
  const candidato = await candidatoRepository.findById(id);

  if (!candidato) {
    return {
      title: "Candidato não encontrado | WGOTalent",
    };
  }

  return {
    title: `${candidato.nome} | Candidatos | WGOTalent`,
    description: `Detalhes do candidato ${candidato.nome} no WGOTalent.`,
  };
}

export default async function CandidatoDetailPage(
  props: CandidatoDetailPageProps,
) {
  const { id } = await props.params;
  const candidato = await candidatoRepository.findByIdComplete(id);

  if (!candidato) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-7xl mx-auto w-full space-y-4">
      <CandidateHeader candidato={candidato} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left / Main Column (2 cols on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <CandidatePersonalInfo candidato={candidato} />
          <CandidateExperience experiencias={candidato.experiencias} />
          <CandidateEducation formacoes={candidato.formacoes} />
          <CandidateCertifications certificacoes={candidato.certificacoes} />
        </div>

        {/* Right / Sidebar Column (1 col on large screens) */}
        <div className="space-y-4">
          <CandidatePreferences candidato={candidato} />
          <CandidateScreenings triagens={candidato.triagens} />
        </div>
      </div>
    </div>
  );
}
