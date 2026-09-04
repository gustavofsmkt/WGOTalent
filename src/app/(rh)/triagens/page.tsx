import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Sparkles, Eye, Layers, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { buttonVariants } from "~/components/ui/button";
import { StatusBadge } from "~/components/status-badge";
import {
  triagemRepository,
  type TriagemFiltros,
} from "~/server/db/repositories/triagem";
import {
  triagemEtapaEnum,
  triagemResultadoEnum,
  triagemMotivoEnum,
} from "~/server/db/schema";
import { TriagemPipelineBoard } from "~/components/triagem-pipeline";
import { MOTIVO_LABELS, getInitials, formatDate } from "~/lib/triagem-format";
import { PageFilter } from "~/components/page-filter";
import { ViewToggle } from "./_components/view-toggle";
import { DeleteTriagemButton } from "./_components/delete-triagem-button";
import MetricCardsSummary from "~/components/metric-cards-summary";
import { DataTable, type ColumnDef } from "~/components/data-table";
import { TablePagination } from "~/components/table-pagination";
import { Skeleton } from "~/components/ui/skeleton";
import {
  buildPageHref,
  DEFAULT_PAGE_SIZE,
  getTotalPages,
  parsePage,
  type SearchParamsRecord,
} from "~/lib/pagination";

const ETAPA_OPTIONS = [
  { value: "todas", label: "Todas as Etapas" },
  { value: "curriculo", label: "Currículo" },
  { value: "testes", label: "Testes" },
  { value: "entrevista_rh", label: "Entrevista RH" },
  { value: "entrevista_gestor", label: "Entrevista Gestor" },
  { value: "finalizado", label: "Finalizado" },
];

const RESULTADO_OPTIONS = [
  { value: "todas", label: "Todos os Resultados" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aprovado", label: "Aprovado" },
  { value: "reprovado", label: "Reprovado" },
  { value: "desistente", label: "Desistente" },
  { value: "banco_talentos", label: "Banco de Talentos" },
];

const MOTIVO_OPTIONS = [
  { value: "todos", label: "Todos os Motivos" },
  { value: "curriculo", label: "Reprovação: Currículo" },
  { value: "fit_cultural", label: "Reprovação: Fit Cultural" },
  { value: "testes", label: "Reprovação: Testes Técnicos" },
  { value: "rh", label: "Reprovação: Avaliação RH" },
  { value: "gestor", label: "Reprovação: Avaliação Gestor" },
  {
    value: "incompatibilidade_salarial",
    label: "Desistência: Incompatibilidade Salarial",
  },
  { value: "aceitou_outra_proposta", label: "Desistência: Outra Proposta" },
  { value: "nao_atendeu_contato", label: "Desistência: Não Atendeu Contato" },
  { value: "motivos_pessoais", label: "Desistência: Motivos Pessoais" },
];

export const dynamic = "force-dynamic";

function isEnumValue<T extends string>(
  values: readonly T[],
  value: string,
): value is T {
  return (values as readonly string[]).includes(value);
}

interface TriagensSearchParams extends SearchParamsRecord {
  etapa?: string;
  resultado?: string;
  motivo?: string;
  q?: string;
  view?: string;
  vagaAtiva?: string;
  vaga?: string;
  page?: string;
}

interface TriagensPageProps {
  searchParams?: Promise<TriagensSearchParams>;
}

async function TriagensContent({
  searchParams,
}: {
  searchParams: TriagensSearchParams;
}) {
  const query = (searchParams.q ?? "").trim();
  const etapaFilter = (searchParams.etapa ?? "").trim().toLowerCase();
  const resultadoFilter = (searchParams.resultado ?? "").trim().toLowerCase();
  const motivoFilter = (searchParams.motivo ?? "").trim().toLowerCase();
  const currentView = searchParams.view === "pipeline" ? "pipeline" : "lista";
  const vagaAtivaFilter = searchParams.vagaAtiva === "1";
  const vagaFilter = (searchParams.vaga ?? "").trim();
  const page = parsePage(searchParams.page);

  const dbFilter: TriagemFiltros = {};
  if (
    etapaFilter &&
    etapaFilter !== "todas" &&
    isEnumValue(triagemEtapaEnum.enumValues, etapaFilter)
  ) {
    dbFilter.etapa = etapaFilter;
  }
  if (
    resultadoFilter &&
    resultadoFilter !== "todas" &&
    isEnumValue(triagemResultadoEnum.enumValues, resultadoFilter)
  ) {
    dbFilter.resultado = resultadoFilter;
  }
  if (
    motivoFilter &&
    motivoFilter !== "todos" &&
    isEnumValue(triagemMotivoEnum.enumValues, motivoFilter)
  ) {
    dbFilter.motivo = motivoFilter;
  }
  if (vagaAtivaFilter) {
    dbFilter.vagaAtiva = true;
  }
  if (vagaFilter && vagaFilter !== "todas") {
    dbFilter.vagaId = vagaFilter;
  }
  if (query) {
    dbFilter.query = query;
  }

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

  const hasActiveFilters =
    Boolean(query) ||
    (etapaFilter && etapaFilter !== "todas") ||
    (resultadoFilter && resultadoFilter !== "todas") ||
    (motivoFilter && motivoFilter !== "todos") ||
    vagaAtivaFilter ||
    Boolean(vagaFilter && vagaFilter !== "todas");

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
        actions={
          <Link
            href="/triagens/nova"
            className={buttonVariants({ variant: "default" })}
          >
            <Plus className="size-4 mr-2" aria-hidden="true" />
            Nova Triagem
          </Link>
        }
      />

      {summary.total === 0 && !hasActiveFilters ? (
        <DataEmptyState
          title={"Nenhuma triagem cadastrada"}
          description={
            "Inicie o processo seletivo criando uma nova triagem de candidato para uma vaga."
          }
          action={
            <Link
              href="/triagens/nova"
              className={buttonVariants({ variant: "default" })}
            >
              <Plus className="size-4 mr-2" aria-hidden="true" />
              Nova Triagem
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
            <PageFilter
              searchPlaceholder="Buscar por candidato, cargo, departamento..."
              searchAriaLabel="Buscar triagem por candidato, cargo ou departamento"
              filterBar={{
                selects: [
                  {
                    paramKey: "vaga",
                    defaultValue: "todas",
                    placeholder: "Vaga",
                    options: [
                      { value: "todas", label: "Todas as Vagas" },
                      ...vagaOptions.map((v) => ({
                        value: v.id,
                        label: `${v.cargo.titulo} — ${v.cidades.map((c) => `${c.nome}/${c.uf}`).join(", ")}`,
                      })),
                    ],
                  },
                  {
                    paramKey: "etapa",
                    defaultValue: "todas",
                    placeholder: "Etapa",
                    options: ETAPA_OPTIONS,
                  },
                  {
                    paramKey: "resultado",
                    defaultValue: "todas",
                    placeholder: "Resultado",
                    options: RESULTADO_OPTIONS,
                  },
                  {
                    paramKey: "motivo",
                    defaultValue: "todos",
                    placeholder: "Motivo",
                    options: MOTIVO_OPTIONS,
                  },
                ],
                checkbox: {
                  paramKey: "vagaAtiva",
                  trueValue: "1",
                  label: "Somente ativas",
                },
              }}
            />

            <ViewToggle />

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
