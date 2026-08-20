import * as React from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Briefcase, Users } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { TriagemForm } from "~/components/triagem-form";
import { DataEmptyState } from "~/components/data-empty-state";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { buttonVariants } from "~/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nova Triagem | WGOTalent",
  description: "Inicie um novo processo de triagem vinculando um candidato a uma vaga.",
};

export default async function NovaTriagemPage() {
  const [candidatoOptions, vagaOptions] = await Promise.all([
    triagemRepository.findActiveCandidatoOptions(),
    triagemRepository.findActiveVagaOptions(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/triagens"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-1.5" />
          Voltar para Triagens
        </Link>
      </div>

      <PageHeader
        title="Nova Triagem"
        description="Vincule um candidato a uma vaga aberta e inicie o fluxo de avaliação seletiva."
      />

      {candidatoOptions.length === 0 ? (
        <DataEmptyState
          icon={Users}
          title="Nenhum candidato ativo disponível"
          description="Para iniciar uma triagem, é necessário ter pelo menos um candidato cadastrado no sistema."
          action={
            <Link
              href="/candidatos/novo"
              className={buttonVariants({ variant: "default" })}
            >
              <UserPlus className="size-4 mr-2" aria-hidden="true" />
              Cadastrar Candidato
            </Link>
          }
        />
      ) : vagaOptions.length === 0 ? (
        <DataEmptyState
          icon={Briefcase}
          title="Nenhuma vaga ativa disponível"
          description="Para iniciar uma triagem, é necessário ter pelo menos uma vaga aberta e ativa cadastrada."
          action={
            <Link
              href="/vagas/novo"
              className={buttonVariants({ variant: "default" })}
            >
              <Briefcase className="size-4 mr-2" aria-hidden="true" />
              Cadastrar Vaga
            </Link>
          }
        />
      ) : (
        <div className="flex justify-center">
          <TriagemForm
            candidatoOptions={candidatoOptions}
            vagaOptions={vagaOptions}
            redirectTo="/triagens"
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
