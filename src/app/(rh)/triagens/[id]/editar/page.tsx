import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { TriagemForm } from "~/components/triagem-form";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { buttonVariants } from "~/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Editar Triagem | WGOTalent",
  description: "Atualize a etapa, o resultado e as observações do processo de triagem.",
};

interface EditarTriagemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarTriagemPage(props: EditarTriagemPageProps) {
  const params = await props.params;
  const triagem = await triagemRepository.findByIdWithJoins(params.id);

  if (!triagem) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/triagens/${triagem.id}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-1.5" />
          Voltar para Detalhes
        </Link>
      </div>

      <PageHeader
        title="Editar Triagem"
        description={`Atualize o status seletivo de ${triagem.candidato.nome} para a vaga de ${triagem.vaga.cargo.titulo}.`}
      />

      <div className="flex justify-center">
        <TriagemForm
          triagem={{
            id: triagem.id,
            candidatoId: triagem.candidatoId,
            vagaId: triagem.vagaId,
            etapa: triagem.etapa,
            resultado: triagem.resultado,
            motivo: triagem.motivo,
            parecerRh: triagem.parecerRh,
            candidato: {
              id: triagem.candidato.id,
              nome: triagem.candidato.nome,
              email: triagem.candidato.email,
            },
            vaga: {
              id: triagem.vaga.id,
              cargoTitulo: triagem.vaga.cargo.titulo,
              departamentoNome: triagem.vaga.cargo.departamento.nome,
              cidade: triagem.vaga.cidade,
              uf: triagem.vaga.uf,
              cargo: {
                titulo: triagem.vaga.cargo.titulo,
                departamento: {
                  nome: triagem.vaga.cargo.departamento.nome,
                },
              },
            },
          }}
          redirectTo={`/triagens/${triagem.id}`}
          className="w-full"
        />
      </div>
    </div>
  );
}
