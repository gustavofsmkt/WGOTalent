import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Plus } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { VagaForm } from "~/components/vaga-form";
import { DataEmptyState } from "~/components/data-empty-state";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { cidadeRepository } from "~/server/db/repositories/cidade";
import { buttonVariants } from "~/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NovaVagaPage() {
  const [cargoOptions, cidadeOptions] = await Promise.all([
    vagaRepository.findActiveCargoOptions(),
    cidadeRepository.findAll(),
  ]);

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/vagas"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-2" />
          Voltar para Vagas
        </Link>
      </div>

      <PageHeader
        title="Nova Vaga"
        description="Abra uma nova vaga no sistema e inicie a atração de talentos."
      />

      {cargoOptions.length === 0 ? (
        <DataEmptyState
          icon={Briefcase}
          title="Nenhum cargo ativo disponível"
          description="Para abrir uma vaga, é necessário ter pelo menos um cargo ativo cadastrado."
          action={
            <Link
              href="/cargos/novo"
              className={buttonVariants({ variant: "default" })}
            >
              <Plus className="size-4 mr-2" aria-hidden="true" />
              Cadastrar Cargo
            </Link>
          }
        />
      ) : (
        <VagaForm cargoOptions={cargoOptions} cidadeOptions={cidadeOptions} />
      )}
    </div>
  );
}
