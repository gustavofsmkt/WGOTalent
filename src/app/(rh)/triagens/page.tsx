import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Sparkles,
  Eye,
  Layers,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { buttonVariants } from "~/components/ui/button";
import { StatusBadge } from "~/components/status-badge";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { TriagemPipelineBoard } from "~/components/triagem-pipeline";
import { MOTIVO_LABELS, getInitials, formatDate } from "~/lib/triagem-format";
import { TriagemPageFilter } from "~/components/triagem-page-filter";
import { TriagemViewToggle } from "~/components/triagem-view-toggle";
import { DeleteTriagemButton } from "./_components/delete-triagem-button";
import MetricCardsSummary from "~/components/metric-cards-summary";
import { DataTable, type ColumnDef } from "~/components/data-table";
import { TablePagination } from "~/components/table-pagination";
import { Skeleton } from "~/components/ui/skeleton";
import {
  buildPageHref,
  DEFAULT_PAGE_SIZE,
  getTotalPages,
} from "~/lib/pagination";
import {
  parseTriagemListFilters,
  type TriagemListSearchParams,
} from "~/lib/triagem-list-filters";

export const dynamic = "force-dynamic";

interface TriagensPageProps {
  searchParams?: Promise<TriagemListSearchParams>;
}

async function TriagensContent({
  searchParams,
}: {
  searchParams: TriagemListSearchParams;
}) {
  const {
    filters: dbFilter,
    currentView,
    page,
    hasActiveFilters,
  } = parseTriagemListFilters(searchParams);

  const triagensPromise =
    currentView === "pipeline"
      ? triagemRepository
          .findAllWithJoins(dbFilter)
          .then((items) => ({ items, total: items.length }))
      : triagemRepository.findPageWithJoins(dbFilter, {
          page,
          pageSize: DEFAULT_PAGE_SIZE,
        });

  const [triagensPage, summary, vagaOptions] = await Promise.all([
    triagensPromise,
    triagemRepository.getListSummary(dbFilter),
    triagemRepository.findActiveVagaOptions(),
  ]);
  const totalPages = getTotalPages(triagensPage.total, DEFAULT_PAGE_SIZE);
  if (currentView === "lista" && triagensPage.total > 0 && page > totalPages) {
    redirect(
      buildPageHref({
        pathname: "/triagens",
        searchParams,
        page: totalPages,
      }),
    );
  }

  type Triagem = (typeof triagensPage.items)[number];

  const columns: ColumnDef<Triagem>[] = [
    {
      header: "Candidato",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(item.candidato.nome)}
          </div>
          <div className="min-w-0">
            <Link
              href={`/triagens/${item.id}`}
              className="font-medium text-foreground hover:underline truncate block"
            >
              {item.candidato.nome}
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              {item.candidato.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Vaga / Cargo",
      cell: (item) => (
        <div className="space-y-0.5">
          <p className="font-medium text-foreground text-xs">
            {item.vaga.cargoTitulo}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.vaga.departamentoNome} •{" "}
            {item.vaga.cidades.map((c) => `${c.nome}/${c.uf}`).join(", ")}
          </p>
        </div>
      ),
    },
    {
      header: "Etapa",
      cell: (item) => <StatusBadge status={item.etapa} />,
    },
    {
      header: "Resultado",
      cell: (item) => (
        <div className="space-y-1">
          <StatusBadge status={item.resultado} />
          {item.motivo && MOTIVO_LABELS[item.motivo] && (
            <p className="text-[11px] text-muted-foreground">
              {MOTIVO_LABELS[item.motivo]}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Score IA",
      cell: (item) =>
        item.avaliacaoIa ? (
          <span
            className="inline-flex items-center gap-2 px-2  rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            title={item.avaliacaoIa.parecerIa || undefined}
          >
            <Sparkles className="size-3 text-primary" />
            {Math.round(Number(item.avaliacaoIa.scoreIa))}%
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: "Data",
      cellClassName: "text-xs text-muted-foreground",
      cell: (item) => formatDate(item.createdAt),
    },
    {
      header: "Ações",
      headerClassName: "w-[60px]",
      cellClassName: "text-right",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/triagens/${item.id}`}
            className={buttonVariants({
              variant: "ghost",
              size: "icon-xs",
            })}
            title="Ver detalhes da triagem"
          >
            <Eye className="size-4" />
            <span className="sr-only">Ver detalhes</span>
          </Link>
          <DeleteTriagemButton
            triagemId={item.id}
            candidatoNome={item.candidato.nome}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-7xl mx-auto w-full space-y-4">
      <PageHeader
        title="Triagens"
        description="Gerencie o fluxo de candidatos pelas etapas do processo seletivo."
      />

      {summary.total === 0 && !hasActiveFilters ? (
        <DataEmptyState
          title={"Nenhuma triagem cadastrada"}
          description={
            "Inicie o processo seletivo abrindo a página de um candidato e criando uma nova triagem para uma vaga."
          }
          action={
            <Link
              href="/candidatos"
              className={buttonVariants({ variant: "default" })}
            >
              <Users className="size-4 mr-2" aria-hidden="true" />
              Ver Candidatos
            </Link>
          }
        />
      ) : (
        <>
          <MetricCardsSummary
            cards={[
              {
                title: "Total de Triagens",
                info: summary.total.toString(),
                icon: <Layers className="size-5" />,
                iconColor: "bg-primary/10",
              },
              {
                title: "Em Andamento",
                info: summary.emAndamento.toString(),
                icon: <Clock className="size-5" />,
                iconColor: "bg-info/10",
              },
              {
                title: "Aprovados",
                info: summary.aprovados.toString(),
                icon: <CheckCircle2 className="size-5" />,
                iconColor: "bg-success/10",
              },
            ]}
          />

          <div className="space-y-2">
            <TriagemPageFilter vagaOptions={vagaOptions} />

            <TriagemViewToggle />

            {triagensPage.items.length === 0 ? (
              <DataEmptyState
                title={"Nenhuma triagem encontrada"}
                description={
                  "Tente ajustar ou limpar os filtros para visualizar outras triagens."
                }
                action={
                  <Link
                    href="/triagens"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Limpar filtros
                  </Link>
                }
              />
            ) : currentView === "pipeline" ? (
              <TriagemPipelineBoard items={triagensPage.items} />
            ) : (
              <div className="flex flex-col gap-4">
                <DataTable
                  columns={columns}
                  rows={triagensPage.items}
                  className="block rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs"
                />
                <TablePagination
                  pathname="/triagens"
                  searchParams={searchParams}
                  page={page}
                  pageSize={DEFAULT_PAGE_SIZE}
                  total={triagensPage.total}
                  itemLabel="triagens"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default async function TriagensPage(props: TriagensPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};

  return (
    <React.Suspense
      key={JSON.stringify(searchParams)}
      fallback={
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      }
    >
      <TriagensContent searchParams={searchParams} />
    </React.Suspense>
  );
}
