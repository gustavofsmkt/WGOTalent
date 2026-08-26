import * as React from "react";
import Link from "next/link";
import { Plus, Briefcase, Eye, Building2, Pencil } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { buttonVariants } from "~/components/ui/button";
import { StatusBadge } from "~/components/status-badge";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { DeleteCargoButton } from "./_components/delete-cargo-button";
import { PageFilter } from "~/components/page-filter";
import { DataTable, type ColumnDef } from "~/components/data-table";

interface CargosPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function CargosPage(props: CargosPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const query = (searchParams.q ?? "").trim().toLowerCase();

  const allCargos = await cargoRepository.findAllWithDepartamento();

  const filteredCargos = query
    ? allCargos.filter(
        (c) =>
          c.titulo.toLowerCase().includes(query) ||
          c.departamento.nome.toLowerCase().includes(query),
      )
    : allCargos;

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

  type Cargo = (typeof allCargos)[number];

  const columns: ColumnDef<Cargo>[] = [
    {
      header: "Título do Cargo",
      cell: (cargo) => (
        <Link
          href={`/cargos/${cargo.id}`}
          className="hover:text-primary hover:underline transition-colors line-clamp-1"
        >
          {cargo.titulo}
        </Link>
      ),
    },
    {
      header: "Departamento",
      cell: (cargo) => (
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Building2 className="size-3.5" />
          <span className="line-clamp-1">{cargo.departamento.nome}</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (cargo) => (
        <StatusBadge
          status={cargo.ativo ? "aberta" : "incompleta"}
          label={cargo.ativo ? "Ativo" : "Inativo"}
        />
      ),
    },
    {
      header: "Criado em",
      cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
      cell: (cargo) => formatDate(cargo.createdAt),
    },
    {
      header: "Ações",
      headerClassName: "w-[100px]",
      cell: (cargo) => (
        <div className="flex items-center justify gap-1">
          <Link
            href={`/cargos/${cargo.id}`}
            className={buttonVariants({
              variant: "ghost",
              size: "icon-sm",
              className: "text-muted-foreground hover:text-primary",
            })}
            title={`Ver detalhes de ${cargo.titulo}`}
            aria-label={`Ver detalhes de ${cargo.titulo}`}
          >
            <Eye className="size-4" />
          </Link>
          <Link
            href={`/cargos/${cargo.id}/editar`}
            className={buttonVariants({
              variant: "ghost",
              size: "icon-sm",
              className: "text-muted-foreground hover:text-primary",
            })}
            title={`Editar ${cargo.titulo}`}
            aria-label={`Editar ${cargo.titulo}`}
          >
            <Pencil className="size-4" />
          </Link>
          <DeleteCargoButton cargoId={cargo.id} cargoTitulo={cargo.titulo} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <PageHeader
        title="Cargos"
        description="Gerencie os cargos e perfis profissionais da organização."
        actions={
          <Link
            href="/cargos/novo"
            className={buttonVariants({ variant: "default" })}
          >
            <Plus className="size-4 mr-2" aria-hidden="true" />
            Novo Cargo
          </Link>
        }
      />

      {allCargos.length === 0 ? (
        <DataEmptyState
          icon={Briefcase}
          title="Nenhum cargo cadastrado"
          description="Cadastre o primeiro cargo para poder abrir vagas e realizar processos seletivos."
          action={
            <Link
              href="/cargos/novo"
              className={buttonVariants({ variant: "default" })}
            >
              <Plus className="size-4 mr-2" aria-hidden="true" />
              Criar Cargo
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <PageFilter
            searchPlaceholder="Buscar cargo por título ou departamento..."
            searchAriaLabel="Buscar cargo por título ou departamento"
          />

          {filteredCargos.length === 0 ? (
            <DataEmptyState
              title="Nenhum cargo encontrado"
              description={`Nenhum resultado corresponde à busca "${query}".`}
              action={
                <Link
                  href="/cargos"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Limpar busca
                </Link>
              }
            />
          ) : (
            <>
              <DataTable columns={columns} rows={filteredCargos} />

              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                {filteredCargos.map((cargo) => (
                  <div
                    key={cargo.id}
                    className="flex flex-col p-4 bg-card rounded-xl border border-border/60 shadow-xs gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/cargos/${cargo.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline line-clamp-2"
                      >
                        {cargo.titulo}
                      </Link>
                      <StatusBadge
                        status={cargo.ativo ? "aberta" : "incompleta"}
                        label={cargo.ativo ? "Ativo" : "Inativo"}
                        className="shrink-0"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="size-3.5" />
                        <span className="line-clamp-1">
                          {cargo.departamento.nome}
                        </span>
                      </div>
                      <div className="text-xs">
                        Criado em {formatDate(cargo.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40 mt-1">
                      <Link
                        href={`/cargos/${cargo.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "h-8 text-xs flex-1",
                        })}
                      >
                        Ver Detalhes
                      </Link>
                      <DeleteCargoButton
                        cargoId={cargo.id}
                        cargoTitulo={cargo.titulo}
                        variant="icon"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
