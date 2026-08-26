import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { CargoForm } from "~/components/cargo-form";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { buttonVariants } from "~/components/ui/button";

interface EditarCargoPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarCargoPage(props: EditarCargoPageProps) {
  const params = await props.params;
  const cargo = await cargoRepository.findById(params.id);

  if (!cargo) {
    notFound();
  }

  const departamentos = await cargoRepository.findActiveDepartamentoOptions();

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/cargos/${cargo.id}`}
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
        title="Editar Cargo"
        description="Atualize as informações cadastrais e requisitos do cargo."
      />

      <div className="flex justify-center">
        <CargoForm
          cargo={{
            id: cargo.id,
            departamentoId: cargo.departamentoId,
            titulo: cargo.titulo,
            descricao: cargo.descricao,
            ativo: cargo.ativo,
            faixaSalarial: cargo.faixaSalarial,
            requisitos: cargo.requisitos,
            requisitosDesejaveis: cargo.requisitosDesejaveis,
            criteriosEliminatorios: cargo.criteriosEliminatorios,
          }}
          departamentoOptions={departamentos}
          redirectTo={`/cargos/${cargo.id}`}
          className="max-w-2xl w-full"
        />
      </div>
    </div>
  );
}
