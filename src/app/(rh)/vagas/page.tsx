import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Briefcase,
  Eye,
  Building2,
  MapPin,
  Users,
  DollarSign,
} from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { buttonVariants } from "~/components/ui/button";
import { StatusBadge } from "~/components/status-badge";
import { Card, CardContent } from "~/components/ui/card";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { DeleteVagaButton } from "./_components/delete-vaga-button";
import { PageFilter } from "~/components/page-filter";
import MetricCardsSummary from "~/components/metric-cards-summary";
import { DataTable, type ColumnDef } from "~/components/data-table";

const STATUS_OPTIONS = [
  { value: "todas", label: "Todos os status" },
  { value: "aberta", label: "Aberta" },
  { value: "pausada", label: "Pausada" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
  { value: "incompleta", label: "Incompleta" },
];

export const dynamic = "force-dynamic";

interface VagasPageProps {
  searchParams?: Promise<{ q?: string; status?: string }>;
}

export default async function VagasPage(props: VagasPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const query = (searchParams.q ?? "").trim().toLowerCase();
  const statusFilter = (searchParams.status ?? "").trim().toLowerCase();

  const allVagas = await vagaRepository.findAllWithCargoAndDepartamento();

  const totalAbertas = allVagas.filter((v) => v.status === "aberta").length;
  const totalPosicoes = allVagas.reduce(
    (acc, v) => acc + (v.posicoesDisponiveis || 0),
    0,
  );

  const filteredVagas = allVagas.filter((vaga) => {
    const matchesQuery =
      !query ||
      vaga.cargo.titulo.toLowerCase().includes(query) ||
      vaga.cargo.departamento.nome.toLowerCase().includes(query) ||
      vaga.cidades.some(
        (c) =>
          c.nome.toLowerCase().includes(query) ||
          c.uf.toLowerCase().includes(query),
      );

    const matchesStatus =
      !statusFilter || statusFilter === "todas" || vaga.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const formatCurrency = (value?: string | null) => {
    if (!value) return "A combinar";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

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

  type Vaga = (typeof allVagas)[number];

  const columns: ColumnDef<Vaga>[] = [
    {
      header: "Cargo / Departamento",
      cell: (vaga) => (
        <>
          <Link
            href={`/vagas/${vaga.id}`}
            className="hover:text-primary hover:underline transition-colors block font-semibold text-foreground"
          >
            {vaga.cargo.titulo}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground ">
            <Building2 className="size-3" />
            <span>{vaga.cargo.departamento.nome}</span>
          </div>
        </>
      ),
    },
    {
      header: "Localização",
      cell: (vaga) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-3.5 text-muted-foreground shrink-0" />
          <span>
            {vaga.cidades.map((c) => `${c.nome} - ${c.uf}`).join(", ")}
          </span>
        </div>
      ),
    },
    {
      header: "Posições",
      cell: (vaga) => (
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-3.5 text-muted-foreground" />
          <span>{vaga.posicoesDisponiveis}</span>
        </div>
      ),
    },
    {
      header: "Remuneração",
      cellClassName: "text-sm font-medium text-foreground",
      cell: (vaga) => formatCurrency(vaga.remuneracaoOferecida),
    },
    {
      header: "Status",
      headerClassName: "w-[120px]",
      cell: (vaga) => <StatusBadge status={vaga.status} />,
    },
    {
      header: "Criada em",
      headerClassName: "w-[120px]",
      cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
      cell: (vaga) => formatDate(vaga.createdAt),
    },
    {
      header: "Ações",
      headerClassName: "w-[60px]",
      cell: (vaga) => (
        <div className="flex items-centergap-1">
          <Link
            href={`/vagas/${vaga.id}`}
            className={buttonVariants({
              variant: "ghost",
              size: "icon-sm",
              className: "text-muted-foreground hover:text-primary",
            })}
            title="Ver detalhes da vaga"
            aria-label="Ver detalhes da vaga"
          >
            <Eye className="size-4" />
          </Link>
          <DeleteVagaButton
            vagaId={vaga.id}
            vagaTitulo={`${vaga.cargo.titulo} (${vaga.cidades.map((c) => c.nome).join(", ")})`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-7xl mx-auto w-full space-y-4">
      <PageHeader
        title="Vagas"
        description="Gerencie as oportunidades de trabalho, departamentos e posições abertas."
        actions={
          <Link
            href="/vagas/novo"
            className={buttonVariants({ variant: "default" })}
          >
            <Plus className="size-4 mr-2" aria-hidden="true" />
            Nova Vaga
          </Link>
        }
      />

      {allVagas.length === 0 ? (
        <DataEmptyState
          icon={Briefcase}
          title="Nenhuma vaga cadastrada"
          description="Cadastre a primeira vaga para iniciar a atração e triagem de talentos."
          action={
            <Link
              href="/vagas/novo"
              className={buttonVariants({ variant: "default" })}
            >
              <Plus className="size-4 mr-2" aria-hidden="true" />
              Criar Vaga
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <MetricCardsSummary
            cards={[
              {
                title: "Total de Vagas",
                info: allVagas.length.toString(),
                icon: <Briefcase className="size-5" />,
                iconColor: "bg-primary/10",
              },
              {
                title: "Vagas Abertas",
                info: totalAbertas.toString(),
                icon: <Building2 className="size-5" />,
                iconColor: "bg-emerald-500/10",
              },
              {
                title: "Posições Totais",
                info: totalPosicoes.toString(),
                icon: <Users className="size-5" />,
                iconColor: "bg-blue-500/10",
              },
            ]}
          />

          <PageFilter
            searchPlaceholder="Buscar por cargo, depto, cidade..."
            searchAriaLabel="Buscar vaga por cargo, departamento ou cidade"
            filterBar={{
              selects: [
                {
                  paramKey: "status",
                  defaultValue: "todas",
                  placeholder: "Status",
                  options: STATUS_OPTIONS,
                },
              ],
            }}
          />

          {filteredVagas.length === 0 ? (
            <DataEmptyState
              title="Nenhuma vaga encontrada"
              description={`Nenhum resultado corresponde aos filtros aplicados.`}
              action={
                <Link
                  href="/vagas"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Limpar filtros
                </Link>
              }
            />
          ) : (
            <>
              <DataTable columns={columns} rows={filteredVagas} />

              {/* Mobile View */}
              <div className="md:hidden space-y-2">
                {filteredVagas.map((vaga) => (
                  <div
                    key={vaga.id}
                    className="flex flex-col p-4 bg-card rounded-xl border border-border/60 shadow-xs gap-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/vagas/${vaga.id}`}
                          className="font-semibold text-foreground hover:text-primary hover:underline line-clamp-1 text-base"
                        >
                          {vaga.cargo.titulo}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground ">
                          <Building2 className="size-3" />
                          <span>{vaga.cargo.departamento.nome}</span>
                        </div>
                      </div>
                      <StatusBadge status={vaga.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        <span>
                          {vaga.cidades.map((c) => `${c.nome} - ${c.uf}`).join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span>
                          {vaga.posicoesDisponiveis}{" "}
                          {vaga.posicoesDisponiveis === 1
                            ? "posição"
                            : "posições"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <DollarSign className="size-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {formatCurrency(vaga.remuneracaoOferecida)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                      <span className="text-muted-foreground">
                        Criada em {formatDate(vaga.createdAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/vagas/${vaga.id}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                            className: "h-8 text-xs",
                          })}
                        >
                          Detalhes
                        </Link>
                        <DeleteVagaButton
                          vagaId={vaga.id}
                          vagaTitulo={`${vaga.cargo.titulo} (${vaga.cidades.map((c) => c.nome).join(", ")})`}
                        />
                      </div>
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
