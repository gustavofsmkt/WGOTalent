import * as React from "react";
import Link from "next/link";
import { Plus, Building2, Eye, Pencil, Briefcase } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { Button, buttonVariants } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { DeleteDepartamentoButton } from "./_components/delete-departamento-button";
import { PageFilter } from "~/components/page-filter";
import { DataTable, type ColumnDef } from "~/components/data-table";

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

  type Departamento = (typeof allDepartamentos)[number];

  const columns: ColumnDef<Departamento>[] = [
    {
      header: "Nome",
      cell: (dept) => {
        const initial = dept.nome.trim().charAt(0).toUpperCase();
        return (
          <div className="flex items-center gap-4">
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
        );
      },
    },
    {
      header: "Descrição",
      cellClassName: "text-muted-foreground text-sm max-w-[360px]",
      cell: (dept) => <p className="line-clamp-2">{dept.descricao}</p>,
    },
    {
      header: "Nº de Cargos",
      cell: (dept) => (
        <Badge
          variant={dept.activeCargosCount > 0 ? "secondary" : "outline"}
          className="font-mono text-xs gap-2"
        >
          <Briefcase className="size-3" />
          {dept.activeCargosCount}
        </Badge>
      ),
    },
    {
      header: "Criado em",
      headerClassName: "w-[140px]",
      cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
      cell: (dept) => formatDate(dept.createdAt),
    },
    {
      header: "Ações",
      headerClassName: "w-[110px]",
      cell: (dept) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/departamentos/${dept.id}`}
            className={buttonVariants({
              variant: "ghost",
              size: "icon-sm",
              className: "text-muted-foreground hover:text-primary",
            })}
            title={`Ver detalhes de ${dept.nome}`}
            aria-label={`Ver detalhes de ${dept.nome}`}
          >
            <Eye className="size-4" />
          </Link>
          <Link href={`/departamentos/${dept.id}/editar`}>
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
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-7xl mx-auto w-full space-y-4">
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
          <PageFilter
            searchPlaceholder="Buscar departamento por nome..."
            searchAriaLabel="Buscar departamento por nome"
          />

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
              <DataTable columns={columns} rows={filteredDepartamentos} />

              {/* Mobile View */}
              <div className="md:hidden space-y-2">
                {filteredDepartamentos.map((dept) => {
                  const initial = dept.nome.trim().charAt(0).toUpperCase();
                  return (
                    <Card
                      key={dept.id}
                      className="border border-border/60 shadow-xs"
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
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
                            className="font-mono text-xs shrink-0 gap-2"
                          >
                            <Briefcase className="size-3" />
                            {dept.activeCargosCount}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-2">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {dept.descricao}
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                          <Link
                            href={`/departamentos/${dept.id}`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                              className:
                                "text-xs text-muted-foreground hover:text-primary h-8",
                            })}
                          >
                            <Eye className="size-3.5 mr-2" />
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
                            <Pencil className="size-3.5 mr-2" />
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
