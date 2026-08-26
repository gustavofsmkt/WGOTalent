import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { CargoForm } from "~/components/cargo-form";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { buttonVariants } from "~/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NovoCargoPage() {
  const departamentos = await cargoRepository.findActiveDepartamentoOptions();

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/cargos"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-2" />
          Voltar para Cargos
        </Link>
      </div>

      <PageHeader
        title="Novo Cargo"
        description="Cadastre um novo cargo na organização."
      />

      <CargoForm departamentoOptions={departamentos} />
    </div>
  );
}
