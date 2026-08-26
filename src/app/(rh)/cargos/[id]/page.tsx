import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Building2,
  Briefcase,
  ArrowLeft,
  MapPin,
  Users,
  Plus,
} from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { buttonVariants } from "~/components/ui/button";
import { DataEmptyState } from "~/components/data-empty-state";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { StatusBadge } from "~/components/status-badge";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { DeleteCargoButton } from "../_components/delete-cargo-button";

interface CargoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CargoDetailPage(props: CargoDetailPageProps) {
  const params = await props.params;
  const cargo = await cargoRepository.findByIdWithDepartamento(params.id);

  if (!cargo) {
    notFound();
  }

  const vagasDoCargo = await cargoRepository.findActiveVagas(params.id);

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
    <div className="p-4 sm:p-4 lg:p-4 max-w-7xl mx-auto w-full space-y-4">
      {/* Breadcrumb / Back button */}
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
        title={cargo.titulo}
        description={
          <div className="flex flex-wrap items-center gap-4 ">
            <StatusBadge
              status={cargo.ativo ? "aberta" : "incompleta"}
              label={cargo.ativo ? "Ativo" : "Inativo"}
              className="text-xs"
            />
            <span className="flex items-center gap-2">
              <Building2 className="size-3.5" />
              {cargo.departamento.nome}
            </span>
            <span className="text-xs">
              Criado em {formatDate(cargo.createdAt)}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DeleteCargoButton
              cargoId={cargo.id}
              cargoTitulo={cargo.titulo}
              redirectTo="/cargos"
              variant="button"
            />
            <Link
              href={`/cargos/${cargo.id}/editar`}
              className={buttonVariants({ variant: "default" })}
            >
              <Pencil className="size-4 mr-2" />
              Editar
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card className="shadow-xs border-border/60">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="text-lg">Descrição do Cargo</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
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
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Requisitos Obrigatórios
                </h3>
                <div className="pl-3.5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {cargo.requisitos}
                </div>
              </div>

              <Separator className="bg-border/60" />

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  Requisitos Desejáveis
                </h3>
                <div className="pl-3.5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {cargo.requisitosDesejaveis || "Não informados."}
                </div>
              </div>

              <Separator className="bg-border/60" />

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  Critérios Eliminatórios
                </h3>
                <div className="pl-3.5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {cargo.criteriosEliminatorios || "Não informados."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="shadow-xs border-border/60">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="text-base">Metadados</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Departamento
                </span>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="size-3.5 text-primary" />
                  {cargo.departamento.nome}
                </p>
              </div>

              <Separator className="bg-border/60" />

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Faixa Salarial Base
                </span>
                <p className="text-sm font-medium text-foreground">
                  {formatCurrency(cargo.faixaSalarial)}
                </p>
              </div>

              <Separator className="bg-border/60" />

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ID do Cargo
                </span>
                <p
                  className="text-xs font-mono text-muted-foreground truncate"
                  title={cargo.id}
                >
                  {cargo.id}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-xs border-border/60">
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="size-4 text-primary" />
            Vagas deste Cargo
            <span className="text-sm font-normal text-muted-foreground">
              ({vagasDoCargo.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vagasDoCargo.length === 0 ? (
            <div className="p-4">
              <DataEmptyState
                icon={Briefcase}
                title="Nenhuma vaga cadastrada para este cargo"
                description="Crie uma vaga para iniciar o processo seletivo deste cargo."
                action={
                  <Link
                    href="/vagas/novo"
                    className={buttonVariants({
                      variant: "default",
                      size: "sm",
                    })}
                  >
                    <Plus className="size-4 mr-2" />
                    Criar Vaga
                  </Link>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="pl-4">Localização</TableHead>
                  <TableHead>Posições</TableHead>
                  <TableHead>Remuneração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="pr-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagasDoCargo.map((vaga) => (
                  <TableRow key={vaga.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        {vaga.cidade} / {vaga.uf}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="size-3.5 text-muted-foreground" />
                        {vaga.posicoesDisponiveis}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(vaga.remuneracaoOferecida)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={vaga.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(vaga.createdAt)}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Link
                        href={`/vagas/${vaga.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Ver
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
