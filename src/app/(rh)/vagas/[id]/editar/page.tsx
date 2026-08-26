import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { VagaForm } from "~/components/vaga-form";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { cidadeRepository } from "~/server/db/repositories/cidade";
import { buttonVariants } from "~/components/ui/button";

export const dynamic = "force-dynamic";

interface EditarVagaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarVagaPage(props: EditarVagaPageProps) {
  const params = await props.params;
  const [vaga, activeCargoOptions, cidadeOptions] = await Promise.all([
    vagaRepository.findById(params.id),
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
        <Link
          href={`/vagas/${vaga.id}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-2" />
          Voltar para Detalhes
        </Link>
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
            remuneracaoOferecida: vaga.remuneracaoOferecida,
            cidade: vaga.cidade,
            uf: vaga.uf,
          }}
          cargoOptions={cargoOptions}
          cidadeOptions={cidadeOptions}
          redirectTo={`/vagas/${vaga.id}`}
        />
      </div>
    </div>
  );
}
