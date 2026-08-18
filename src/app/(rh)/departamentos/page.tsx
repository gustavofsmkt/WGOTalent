import * as React from "react";
import Link from "next/link";
import { Plus, Building2, Eye, Pencil, Briefcase } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { Button, buttonVariants } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { DeleteDepartamentoButton } from "./_components/delete-departamento-button";
import { DepartamentosFilter } from "./_components/departamentos-filter";

interface DepartamentosPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function DepartamentosPage(props: DepartamentosPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const query = (searchParams.q ?? "").trim().toLowerCase();

  const allDepartamentos =
    await departamentoRepository.findAllWithActiveCargosCount();

  const filteredDepartamentos = query
    ? allDepartamentos.filter(
        (d) =>
          d.nome.toLowerCase().includes(query) ||
          d.descricao.toLowerCase().includes(query),
      )
    : allDepartamentos;

  const formatDate = (date: Date | string) => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(date));
    } catch {
      return "";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <PageHeader
        title="Departamentos"
        description="Gerencie a estrutura organizacional da empresa."
        actions={
          <Link
            href="/departamentos/novo"
            className={buttonVariants({ variant: "default" })}
          >
            <Plus className="size-4 mr-2" aria-hidden="true" />
            Novo Departamento
          </Link>
        }
      />

      {allDepartamentos.length === 0 ? (
        <DataEmptyState
          icon={Building2}
          title="Nenhum departamento cadastrado"
          description="Cadastre o primeiro departamento para começar a estruturar os cargos e vagas da organização."
          action={
            <Link
              href="/departamentos/novo"
              className={buttonVariants({ variant: "default" })}
            >
              <Plus className="size-4 mr-2" aria-hidden="true" />
              Criar Departamento
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
            <DepartamentosFilter />
            <div className="text-xs text-muted-foreground">
              {filteredDepartamentos.length === allDepartamentos.length ? (
                <span>
                  Total de{" "}
                  <strong className="font-semibold text-foreground">
                    {allDepartamentos.length}
                  </strong>{" "}
                  {allDepartamentos.length === 1
                    ? "departamento"
                    : "departamentos"}
                </span>
              ) : (
                <span>
                  Mostrando{" "}
                  <strong className="font-semibold text-foreground">
                    {filteredDepartamentos.length}
                  </strong>{" "}
                  de {allDepartamentos.length} departamentos
                </span>
              )}
            </div>
          </div>

          {filteredDepartamentos.length === 0 ? (
            <DataEmptyState
              title="Nenhum departamento encontrado"
              description={`Nenhum resultado corresponde à busca "${query}".`}
              action={
                <Link
                  href="/departamentos"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Limpar busca
                </Link>
              }
            />
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[280px]">Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-[140px] text-center">
                        Nº de Cargos
                      </TableHead>
                      <TableHead className="w-[140px]">Criado em</TableHead>
                      <TableHead className="w-[130px] text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartamentos.map((dept) => {
                      const initial = dept.nome.trim().charAt(0).toUpperCase();
                      return (
                        <TableRow
                          key={dept.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-lg bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0 text-sm border border-primary/20">
                                {initial}
                              </div>
                              <Link
                                href={`/departamentos/${dept.id}`}
                                className="hover:text-primary hover:underline transition-colors line-clamp-1"
                              >
                                {dept.nome}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[360px]">
                            <p className="line-clamp-2">{dept.descricao}</p>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                dept.activeCargosCount > 0
                                  ? "secondary"
                                  : "outline"
                              }
                              className="font-mono text-xs gap-1"
                            >
                              <Briefcase className="size-3" />
                              {dept.activeCargosCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(dept.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/departamentos/${dept.id}`}
                                className={buttonVariants({
                                  variant: "ghost",
                                  size: "icon-sm",
                                  className:
                                    "text-muted-foreground hover:text-primary",
                                })}
                                title={`Ver detalhes de ${dept.nome}`}
                                aria-label={`Ver detalhes de ${dept.nome}`}
                              >
                                <Eye className="size-4" />
                              </Link>
                              <Link
                                href={`/departamentos/${dept.id}/editar`}>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  type="button"
                                  className="text-muted-foreground hover:text-primary"
                                  title={`Editar ${dept.nome}`}
                                  aria-label={`Editar ${dept.nome}`}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              </Link>
                              <DeleteDepartamentoButton
                                departamentoId={dept.id}
                                departamentoNome={dept.nome}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                {filteredDepartamentos.map((dept) => {
                  const initial = dept.nome.trim().charAt(0).toUpperCase();
                  return (
                    <Card
                      key={dept.id}
                      className="border border-border/60 shadow-xs"
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0 text-sm border border-primary/20">
                              {initial}
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold leading-tight">
                                <Link
                                  href={`/departamentos/${dept.id}`}
                                  className="hover:text-primary hover:underline transition-colors"
                                >
                                  {dept.nome}
                                </Link>
                              </CardTitle>
                              <span className="text-xs text-muted-foreground">
                                Criado em {formatDate(dept.createdAt)}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              dept.activeCargosCount > 0
                                ? "secondary"
                                : "outline"
                            }
                            className="font-mono text-xs shrink-0 gap-1"
                          >
                            <Briefcase className="size-3" />
                            {dept.activeCargosCount}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {dept.descricao}
                        </p>
                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/40">
                          <Link
                            href={`/departamentos/${dept.id}`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                              className:
                                "text-xs text-muted-foreground hover:text-primary h-8",
                            })}
                          >
                            <Eye className="size-3.5 mr-1.5" />
                            Detalhes
                          </Link>
                          <Link
                            href={`/departamentos/${dept.id}/editar`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                              className:
                                "text-xs text-muted-foreground hover:text-primary h-8",
                            })}
                          >
                            <Pencil className="size-3.5 mr-1.5" />
                            Editar
                          </Link>
                          <DeleteDepartamentoButton
                            departamentoId={dept.id}
                            departamentoNome={dept.nome}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
