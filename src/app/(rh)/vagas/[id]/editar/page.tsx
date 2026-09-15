import * as React from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "~/components/page-header";
import { BackButton } from "~/components/back-button";
import { VagaForm } from "~/components/vaga-form";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { cidadeRepository } from "~/server/db/repositories/cidade";

export const dynamic = "force-dynamic";

interface EditarVagaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarVagaPage(props: EditarVagaPageProps) {
  const params = await props.params;
  const [vaga, cidadeIds, activeCargoOptions, cidadeOptions] = await Promise.all([
    vagaRepository.findById(params.id),
    vagaRepository.findCidadeIdsByVagaId(params.id),
    vagaRepository.findActiveCargoOptions(),
    cidadeRepository.findAll(),
  ]);

  if (!vaga) {
    notFound();
  }
  let cargoOptions = activeCargoOptions;

  // If the currently assigned cargo is not in active options (e.g. deactivated), include it so select retains its value
  if (!activeCargoOptions.some((c) => c.id === vaga.cargoId)) {
    const currentCargo = await cargoRepository.findByIdWithDepartamento(
      vaga.cargoId,
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

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref={`/vagas/${vaga.id}`}>Voltar</BackButton>
      </div>

      <PageHeader
        title="Editar Vaga"
        description="Atualize o status, posições, remuneração ou localização da vaga."
      />

      <div className="flex justify-center">
        <VagaForm
          vaga={{
            id: vaga.id,
            cargoId: vaga.cargoId,
            status: vaga.status,
            posicoesDisponiveis: vaga.posicoesDisponiveis,
            notaCorte: vaga.notaCorte,
            remuneracaoOferecida: vaga.remuneracaoOferecida,
            cidadeIds,
          }}
          cargoOptions={cargoOptions}
          cidadeOptions={cidadeOptions}
          redirectTo={`/vagas/${vaga.id}`}
        />
      </div>
    </div>
  );
}
