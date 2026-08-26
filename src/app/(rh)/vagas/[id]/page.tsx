import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Building2,
  ArrowLeft,
  MapPin,
  Users,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { StatusBadge } from "~/components/status-badge";
import { Separator } from "~/components/ui/separator";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { TriagemPipelineBoard } from "~/components/triagem-pipeline";
import { DeleteVagaButton } from "../_components/delete-vaga-button";

interface VagaDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function VagaDetailPage(props: VagaDetailPageProps) {
  const params = await props.params;
  const vaga = await vagaRepository.findByIdWithCargoAndDepartamento(params.id);

  if (!vaga) {
    notFound();
  }

  const triagensAtivas = await triagemRepository.findAllWithJoins({
    vagaId: vaga.id,
    resultado: "em_andamento",
  });

  const formatCurrency = (value?: string | null) => {
    if (!value) return "Não informada";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2">
        <Link
          href="/vagas"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-1.5" />
          Voltar para Vagas
        </Link>
      </div>

      <PageHeader
        title={vaga.cargo.titulo}
        description={
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            <StatusBadge status={vaga.status} className="text-xs" />
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              {vaga.cargo.departamento.nome}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {vaga.cidade} / {vaga.uf}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              {vaga.posicoesDisponiveis}{" "}
              {vaga.posicoesDisponiveis === 1 ? "posição" : "posições"}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DeleteVagaButton
              vagaId={vaga.id}
              vagaTitulo={`${vaga.cargo.titulo} (${vaga.cidade}/${vaga.uf})`}
              redirectTo="/vagas"
              variant="button"
            />
            <Link
              href={`/vagas/${vaga.id}/editar`}
              className={buttonVariants({ variant: "default" })}
            >
              <Pencil className="size-4 mr-2" />
              Editar Vaga
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Cargo Details */}
          <Card className="shadow-xs border-border/60">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Descrição do Cargo</CardTitle>
              <Link
                href={`/cargos/${vaga.cargo.id}`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver Cargo completo
                <ExternalLink className="size-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {vaga.cargo.descricao}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-border/60">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="text-lg">Requisitos e Critérios</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Requisitos Obrigatórios
                </h3>
                <div className="pl-3.5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {vaga.cargo.requisitos || "Nenhum requisito especificado."}
                </div>
              </div>

              {vaga.cargo.requisitosDesejaveis && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-foreground" />
                    Requisitos Desejáveis
                  </h3>
                  <div className="pl-3.5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {vaga.cargo.requisitosDesejaveis}
                  </div>
                </div>
              )}

              {vaga.cargo.criteriosEliminatorios && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    Critérios Eliminatórios
                  </h3>
                  <div className="pl-3.5 text-sm text-destructive/90 whitespace-pre-wrap leading-relaxed">
                    {vaga.cargo.criteriosEliminatorios}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Panel - 1 column */}
        <div className="space-y-6">
          <Card className="shadow-xs border-border/60">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="text-lg">Informações da Vaga</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                  Status da Oportunidade
                </span>
                <div className="mt-1">
                  <StatusBadge status={vaga.status} />
                </div>
              </div>

              <Separator />

              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                  Local de Trabalho
                </span>
                <span className="text-sm font-medium text-foreground mt-0.5 block">
                  {vaga.cidade} / {vaga.uf}
                </span>
              </div>

              <Separator />

              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                  Posições Disponíveis
                </span>
                <span className="text-sm font-medium text-foreground mt-0.5 block">
                  {vaga.posicoesDisponiveis}{" "}
                  {vaga.posicoesDisponiveis === 1 ? "posição" : "posições"}
                </span>
              </div>

              <Separator />

              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                  Remuneração Oferecida
                </span>
                <span className="text-sm font-medium text-foreground mt-0.5 block">
                  {formatCurrency(vaga.remuneracaoOferecida)}
                </span>
              </div>

              <Separator />

              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                  Departamento
                </span>
                <span className="text-sm font-medium text-foreground mt-0.5 block">
                  {vaga.cargo.departamento.nome}
                </span>
              </div>

              <Separator />

              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                  Criada em
                </span>
                <span className="text-sm text-muted-foreground mt-0.5 block">
                  {formatDate(vaga.createdAt)}
                </span>
              </div>

              {vaga.updatedAt && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                    Última Atualização
                  </span>
                  <span className="text-sm text-muted-foreground mt-0.5 block">
                    {formatDate(vaga.updatedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pipeline de Candidatos */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Pipeline de Candidatos
          </h2>
        </div>
        {triagensAtivas.length === 0 ? (
          <DataEmptyState
            title="Nenhuma triagem ativa"
            description="Nenhuma triagem em andamento para esta vaga."
          />
        ) : (
          <TriagemPipelineBoard items={triagensAtivas} />
        )}
      </div>
    </div>
  );
}
