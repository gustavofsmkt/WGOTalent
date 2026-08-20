import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { CandidatoBaseForm } from "~/components/candidato-form";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { buttonVariants } from "~/components/ui/button";

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

export default async function EditarCandidatoPage(props: EditarCandidatoPageProps) {
  const { id } = await props.params;
  const candidato = await candidatoRepository.findByIdComplete(id);

  if (!candidato) {
    notFound();
  }

  const [activeCargoOptions, activeDepartamentoOptions] = await Promise.all([
    candidatoRepository.findActiveCargoOptions(),
    candidatoRepository.findActiveDepartamentoOptions(),
  ]);

  let cargoOptions = activeCargoOptions;
  if (
    candidato.cargoInteresseId &&
    !activeCargoOptions.some((c) => c.id === candidato.cargoInteresseId)
  ) {
    const currentCargo = await cargoRepository.findByIdWithDepartamento(
      candidato.cargoInteresseId,
    );
    if (currentCargo) {
      cargoOptions = [
        {
          id: currentCargo.id,
          titulo: `${currentCargo.titulo} (Inativo)`,
          departamento: {
            id: currentCargo.departamento.id,
            nome: currentCargo.departamento.nome,
          },
        },
        ...activeCargoOptions,
      ];
    }
  }

  let departamentoOptions = activeDepartamentoOptions;
  if (
    candidato.areaInteresseId &&
    !activeDepartamentoOptions.some((d) => d.id === candidato.areaInteresseId)
  ) {
    const currentDept = await departamentoRepository.findById(
      candidato.areaInteresseId,
    );
    if (currentDept) {
      departamentoOptions = [
        {
          id: currentDept.id,
          nome: `${currentDept.nome} (Inativo)`,
        },
        ...activeDepartamentoOptions,
      ];
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/candidatos/${candidato.id}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-1.5" />
          Voltar para Detalhes
        </Link>
      </div>

      <PageHeader
        title="Editar Candidato"
        description={`Atualize as informações, histórico profissional e preferências de ${candidato.nome}.`}
      />

      <div className="flex justify-center">
        <CandidatoBaseForm
          candidato={candidato}
          cargoOptions={cargoOptions}
          departamentoOptions={departamentoOptions}
          redirectTo={`/candidatos/${candidato.id}`}
          className="w-full"
        />
      </div>
    </div>
  );
}
