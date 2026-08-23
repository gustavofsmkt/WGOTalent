import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Building2, Briefcase, ChevronRight, MapPin, Users } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { Button, buttonVariants } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { StatusBadge } from "~/components/status-badge";
import { Separator } from "~/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href="/cargos"
              className="hover:text-foreground transition-colors"
            >
              Cargos
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">Detalhes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            {cargo.titulo}
            <StatusBadge
              status={cargo.ativo ? "aberta" : "incompleta"}
              label={cargo.ativo ? "Ativo" : "Inativo"}
              className="text-sm mt-1 sm:mt-0"
            />
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground text-sm pt-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="size-4" />
              <span>{cargo.departamento.nome}</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-border/60 pl-4">
              <span>Criado em {formatDate(cargo.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DeleteCargoButton
            cargoId={cargo.id}
            cargoTitulo={cargo.titulo}
            redirectTo="/cargos"
            variant="button"
            className="flex-1 sm:flex-none"
          />
          <Link
            href={`/cargos/${cargo.id}/editar`}
            className={buttonVariants({
              variant: "default",
              className: "flex-1 sm:flex-none",
            })}
          >
            <Pencil className="size-4 mr-2" />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-xs border-border/60">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="text-lg">Descrição do Cargo</CardTitle>
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

        <div className="space-y-6">
          <Card className="shadow-xs border-border/60">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="text-base">Metadados</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
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
                <p className="text-xs font-mono text-muted-foreground truncate" title={cargo.id}>
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma vaga cadastrada para este cargo.
              </p>
              <Link
                href={`/vagas/novo`}
                className={buttonVariants({ variant: "outline", className: "mt-4 text-sm" })}
              >
                Criar primeira vaga
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="pl-6">Localização</TableHead>
                  <TableHead>Posições</TableHead>
                  <TableHead>Remuneração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="pr-6 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagasDoCargo.map((vaga) => (
                  <TableRow key={vaga.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        {vaga.cidade} / {vaga.uf}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
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
                    <TableCell className="pr-6 text-right">
                      <Link
                        href={`/vagas/${vaga.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
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
