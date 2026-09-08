import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Sparkles, Users } from "lucide-react";
import { DataEmptyState } from "~/components/data-empty-state";
import { DataTable, type ColumnDef } from "~/components/data-table";
import { StatusBadge } from "~/components/status-badge";
import { TablePagination } from "~/components/table-pagination";
import { TriagemPageFilter } from "~/components/triagem-page-filter";
import { TriagemPipelineBoard } from "~/components/triagem-pipeline";
import { TriagemViewToggle } from "~/components/triagem-view-toggle";
import { buttonVariants } from "~/components/ui/button";
import { DeleteTriagemButton } from "~/app/(rh)/triagens/_components/delete-triagem-button";
import { formatDate, getInitials, MOTIVO_LABELS } from "~/lib/triagem-format";
import {
  buildPageHref,
  DEFAULT_PAGE_SIZE,
  getTotalPages,
} from "~/lib/pagination";
import {
  parseTriagemListFilters,
  type TriagemListSearchParams,
} from "~/lib/triagem-list-filters";
import {
  triagemRepository,
  type TriagemListItem,
} from "~/server/db/repositories/triagem";

export async function VagaTriagensSection({
  vagaId,
  searchParams,
}: {
  vagaId: string;
  searchParams: TriagemListSearchParams;
}) {
  const pathname = `/vagas/${vagaId}`;
  const { filters, currentView, page } = parseTriagemListFilters(
    searchParams,
    vagaId,
  );
  const triagensPage =
    currentView === "pipeline"
      ? await triagemRepository
          .findAllWithJoins(filters)
          .then((items) => ({ items, total: items.length }))
      : await triagemRepository.findPageWithJoins(filters, {
          page,
          pageSize: DEFAULT_PAGE_SIZE,
        });

  const totalPages = getTotalPages(triagensPage.total, DEFAULT_PAGE_SIZE);
  if (currentView === "lista" && triagensPage.total > 0 && page > totalPages) {
    redirect(
      buildPageHref({
        pathname,
        searchParams,
        page: totalPages,
      }),
    );
  }

  const columns: ColumnDef<TriagemListItem>[] = [
    {
      header: "Candidato",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {getInitials(item.candidato.nome)}
          </div>
          <div className="min-w-0">
            <Link
              href={`/triagens/${item.id}`}
              className="block truncate font-medium text-foreground hover:underline"
            >
              {item.candidato.nome}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {item.candidato.email}
            </p>
          </div>
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
          {item.motivo && MOTIVO_LABELS[item.motivo] ? (
            <p className="text-[11px] text-muted-foreground">
              {MOTIVO_LABELS[item.motivo]}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      header: "Score IA",
      cell: (item) =>
        item.avaliacaoIa ? (
          <span
            className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2 text-xs font-semibold text-primary"
            title={item.avaliacaoIa.parecerIa || undefined}
          >
            <Sparkles className="size-3" aria-hidden="true" />
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
            className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
            title="Ver detalhes da triagem"
          >
            <Eye className="size-4" aria-hidden="true" />
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
    <section className="space-y-3" aria-labelledby="candidatos-vaga-title">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2
          id="candidatos-vaga-title"
          className="text-lg font-semibold text-foreground"
        >
          Candidatos da vaga
        </h2>
      </div>

      <TriagemPageFilter />
      <TriagemViewToggle />

      {triagensPage.items.length === 0 ? (
        <DataEmptyState
          title="Nenhuma triagem encontrada"
          description="Tente ajustar os filtros para visualizar outros candidatos desta vaga."
          action={
            <Link
              href={`${pathname}?vagaAtiva=0`}
              className={buttonVariants({ variant: "outline" })}
            >
              Mostrar todas
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
            className="block"
          />
          <TablePagination
            pathname={pathname}
            searchParams={searchParams}
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={triagensPage.total}
            itemLabel="triagens"
          />
        </div>
      )}
    </section>
  );
}
