import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DepartamentoForm } from "~/components/departamento-form";
import { buttonVariants } from "~/components/ui/button";

export const metadata = {
  title: "Novo Departamento | WGOTalent",
  description: "Cadastre um novo departamento na estrutura organizacional.",
};

export default function NovoDepartamentoPage() {
  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/departamentos"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-2" />
          Voltar para Departamentos
        </Link>
      </div>

      <PageHeader
        title="Novo Departamento"
        description="Preencha os dados abaixo para cadastrar um novo departamento na organização."
      />

      <DepartamentoForm redirectTo="/departamentos" />
    </div>
  );
}
