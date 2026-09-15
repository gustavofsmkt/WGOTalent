import * as React from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "~/components/page-header";
import { BackButton } from "~/components/back-button";
import { DepartamentoForm } from "~/components/departamento-form";
import { departamentoRepository } from "~/server/db/repositories/departamento";

interface EditDepartamentoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: EditDepartamentoPageProps) {
  const { id } = await props.params;
  const departamento = await departamentoRepository.findById(id);

  if (!departamento) {
    return {
      title: "Departamento não encontrado | WGOTalent",
    };
  }

  return {
    title: `Editar ${departamento.nome} | Departamentos | WGOTalent`,
    description: `Atualizar dados do departamento ${departamento.nome}`,
  };
}

export default async function EditDepartamentoPage(
  props: EditDepartamentoPageProps,
) {
  const { id } = await props.params;
  const departamento = await departamentoRepository.findById(id);

  if (!departamento) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref={`/departamentos/${departamento.id}`}>
          Voltar
        </BackButton>
      </div>

      <PageHeader
        title="Editar Departamento"
        description={`Atualize as informações cadastrais e a descrição de "${departamento.nome}".`}
      />

      <div className="flex justify-center">
        <DepartamentoForm
          departamento={departamento}
          redirectTo={`/departamentos/${departamento.id}`}
        />
      </div>
    </div>
  );
}
