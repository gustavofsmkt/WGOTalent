import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Building2,
  Calendar,
  Clock,
  Briefcase,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { buttonVariants } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { DeleteDepartamentoButton } from "../_components/delete-departamento-button";

interface DepartamentoDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: DepartamentoDetailPageProps) {
  const { id } = await props.params;
  const departamento = await departamentoRepository.findById(id);

  if (!departamento) {
    return {
      title: "Departamento não encontrado | WGOTalent",
    };
  }

  return {
    title: `${departamento.nome} | Departamentos | WGOTalent`,
    description: departamento.descricao,
  };
}

export default async function DepartamentoDetailPage(
  props: DepartamentoDetailPageProps,
) {
  const { id } = await props.params;
  const departamento = await departamentoRepository.findById(id);

  if (!departamento) {
    notFound();
  }

  const cargosVinculados = await departamentoRepository.findActiveCargos(id);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date));
    } catch {
      return "—";
    }
  };

  const formatCurrency = (val: string | number | null | undefined) => {
    if (!val) return "Não informada";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "Não informada";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const initial = departamento.nome.trim().charAt(0).toUpperCase();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2">
        <Link
          href="/departamentos"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-1.5" />
          Voltar para Departamentos
        </Link>
      </div>

      {/* Page Header with Actions */}
      <PageHeader
        title={departamento.nome}
        description="Detalhes cadastrais e cargos associados a este departamento."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/departamentos/${departamento.id}/editar`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="size-4 mr-1.5" />
              Editar
            </Link>
            <DeleteDepartamentoButton
              departamentoId={departamento.id}
              departamentoNome={departamento.nome}
              redirectTo="/departamentos"
              variant="button"
            />
          </div>
        }
      />

      {/* Main Grid: Details Overview + Linked Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2 cols on lg): Overview & Description */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
              <div className="size-12 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-lg border border-primary/20">
                {initial}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">
                    {departamento.nome}
                  </CardTitle>
                  <Badge variant="outline" className="gap-1 text-xs text-primary border-primary/30 bg-primary/5">
                    <CheckCircle2 className="size-3 text-primary" />
                    Ativo
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Identificador: <span className="font-mono text-muted-foreground">{departamento.id}</span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Descrição e Atribuições
                </h3>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/40">
                  {departamento.descricao}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Linked Cargos Section */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="size-5 text-primary" />
                    Cargos Vinculados
                  </CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {cargosVinculados.length}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  Cargos ativos vinculados a este departamento.
                </CardDescription>
              </div>
              <Link
                href={`/cargos/novo?departamentoId=${departamento.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Plus className="size-4 mr-1.5" />
                Novo Cargo
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {cargosVinculados.length === 0 ? (
                <div className="p-6">
                  <DataEmptyState
                    icon={Briefcase}
                    title="Nenhum cargo vinculado"
                    description="Este departamento ainda não possui cargos cadastrados."
                    action={
                      <Link
                        href={`/cargos/novo?departamentoId=${departamento.id}`}
                        className={buttonVariants({ variant: "default", size: "sm" })}
                      >
                        <Plus className="size-4 mr-1.5" />
                        Cadastrar Cargo
                      </Link>
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>Título do Cargo</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[180px]">Faixa Salarial</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cargosVinculados.map((cargo) => (
                        <TableRow
                          key={cargo.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <Link
                              href={`/cargos/${cargo.id}`}
                              className="hover:text-primary hover:underline transition-colors"
                            >
                              {cargo.titulo}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={cargo.ativo ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {cargo.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatCurrency(cargo.faixaSalarial)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/cargos/${cargo.id}`}
                              className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                                className: "text-xs",
                              })}
                            >
                              Ver
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (1 col on lg): Metadata & Quick Info */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Metadados do Registro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Cadastrado em</div>
                  <div className="font-medium text-foreground">
                    {formatDate(departamento.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Última atualização</div>
                  <div className="font-medium text-foreground">
                    {formatDate(departamento.updatedAt)}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total de cargos ativos:</span>
                  <span className="font-semibold text-foreground">
                    {cargosVinculados.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
