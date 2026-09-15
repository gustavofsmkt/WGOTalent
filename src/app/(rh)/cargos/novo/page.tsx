import * as React from "react";
import { PageHeader } from "~/components/page-header";
import { BackButton } from "~/components/back-button";
import { CargoForm } from "~/components/cargo-form";
import { cargoRepository } from "~/server/db/repositories/cargo";

export const dynamic = "force-dynamic";

export default async function NovoCargoPage() {
  const departamentos = await cargoRepository.findActiveDepartamentoOptions();

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/cargos">Voltar</BackButton>
      </div>

      <PageHeader
        title="Novo Cargo"
        description="Cadastre um novo cargo na organização."
      />

      <CargoForm departamentoOptions={departamentos} />
    </div>
  );
}
