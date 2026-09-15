import * as React from "react";
import { PageHeader } from "~/components/page-header";
import { BackButton } from "~/components/back-button";
import { DepartamentoForm } from "~/components/departamento-form";

export const metadata = {
  title: "Novo Departamento | WGOTalent",
  description: "Cadastre um novo departamento na estrutura organizacional.",
};

export default function NovoDepartamentoPage() {
  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/departamentos">Voltar</BackButton>
      </div>

      <PageHeader
        title="Novo Departamento"
        description="Preencha os dados abaixo para cadastrar um novo departamento na organização."
      />

      <DepartamentoForm redirectTo="/departamentos" />
    </div>
  );
}
