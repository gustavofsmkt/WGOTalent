import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Building2,
  Briefcase,
  ChevronRight,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { StatusBadge } from "~/components/status-badge";
import { Separator } from "~/components/ui/separator";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { cargoRepository } from "~/server/db/repositories/cargo";
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

  const cargo = await cargoRepository.findById(vaga.cargoId);
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
      {/* Header with breadcrumbs and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href="/vagas"
              className="hover:text-foreground transition-colors"
            >
              Vagas
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">Detalhes</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {vaga.cargo.titulo}
            </h1>
            <StatusBadge status={vaga.status} className="text-sm" />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm pt-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="size-4" />
              <span>{vaga.cargo.departamento.nome}</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-border/60 pl-4">
              <MapPin className="size-4" />
              <span>
                {vaga.cidade} / {vaga.uf}
              </span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-border/60 pl-4">
              <Users className="size-4" />
              <span>
                {vaga.posicoesDisponiveis}{" "}
                {vaga.posicoesDisponiveis === 1 ? "posição" : "posições"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-border/60 pl-4">
              <span>Criada em {formatDate(vaga.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DeleteVagaButton
            vagaId={vaga.id}
            vagaTitulo={`${vaga.cargo.titulo} (${vaga.cidade}/${vaga.uf})`}
            redirectTo="/vagas"
            variant="button"
            className="flex-1 sm:flex-none"
          />
          <Link
            href={`/vagas/${vaga.id}/editar`}
            className={buttonVariants({
              variant: "default",
              className: "flex-1 sm:flex-none",
            })}
          >
            <Pencil className="size-4 mr-2" />
            Editar Vaga
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Cargo Details */}
          {cargo && (
            <>
              <Card className="shadow-xs border-border/60">
                <CardHeader className="bg-muted/30 border-b border-border/40 pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Descrição do Cargo</CardTitle>
                  <Link
                    href={`/cargos/${cargo.id}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Ver Cargo completo
                    <ExternalLink className="size-3" />
                  </Link>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {cargo.descricao}
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
                      {cargo.requisitos || "Nenhum requisito especificado."}
                    </div>
                  </div>

                  {cargo.requisitosDesejaveis && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary-foreground" />
                        Requisitos Desejáveis
                      </h3>
                      <div className="pl-3.5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {cargo.requisitosDesejaveis}
                      </div>
                    </div>
                  )}

                  {cargo.criteriosEliminatorios && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        Critérios Eliminatórios
                      </h3>
                      <div className="pl-3.5 text-sm text-destructive/90 whitespace-pre-wrap leading-relaxed">
                        {cargo.criteriosEliminatorios}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
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
                  {vaga.posicoesDisponiveis} {vaga.posicoesDisponiveis === 1 ? "posição" : "posições"}
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
          <Card className="shadow-xs border-border/60">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma triagem ativa para esta vaga.
            </CardContent>
          </Card>
        ) : (
          <TriagemPipelineBoard items={triagensAtivas} />
        )}
      </div>
    </div>
  );
}
