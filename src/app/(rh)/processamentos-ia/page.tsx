import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, Download, UserRound } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { StatusBadge, type StatusTone } from "~/components/status-badge";
import { buttonVariants } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { DataTable, type ColumnDef } from "~/components/data-table";
import { TablePagination } from "~/components/table-pagination";
import {
  processamentoIaRepository,
  PROCESSAMENTO_SORT_KEYS,
  type ProcessamentoIaListItem,
} from "~/server/db/repositories/processamento-ia";
import {
  buildPageHref,
  DEFAULT_PAGE_SIZE,
  getTotalPages,
  parsePage,
} from "~/lib/pagination";
import {
  parseSomenteFalhas,
  type ProcessamentoIaSearchParams,
} from "~/lib/processamento-ia-filters";
import { parseSort } from "~/lib/sort";
import { processamentoIaFluxoSchema } from "~/lib/validation/processamento-ia";
import { getCurriculoDownloadUrl } from "./_components/curriculo-download";
import { FluxoTabs, type ProcessamentoFluxo } from "./_components/fluxo-tabs";
import { RetryProcessamentoButton } from "./_components/retry-processamento-button";
import { RetryUltimasFalhasButton } from "./_components/retry-ultimas-falhas-button";
import { SomenteFalhasCheckbox } from "./_components/somente-falhas-checkbox";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Processamentos de IA | WGOTalent",
};

const STATUS_CONFIG: Record<
  ProcessamentoIaListItem["status"],
  { label: string; tone: StatusTone }
> = {
  processando: { label: "Processando", tone: "info" },
  sucesso: { label: "Sucesso", tone: "success" },
  falha: { label: "Falha", tone: "destructive" },
};

const ETAPA_LABEL: Record<ProcessamentoIaListItem["etapa"], string> = {
  extracao: "Extração de currículo",
  classificador: "Classificação de aderência",
  avaliador: "Avaliação da triagem",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function descricaoEntidades(item: ProcessamentoIaListItem): string {
  if (item.etapa === "extracao") {
    return item.candidatoNome ?? "Currículo recebido por e-mail";
  }
  if (item.etapa === "avaliador") {
    return `${item.candidatoNome ?? "Candidato não identificado"} → ${item.vagaTitulo ?? "Vaga não identificada"}`;
  }
  return item.fluxo === "candidato_vagas"
    ? (item.candidatoNome ?? "Candidato não identificado")
    : (item.vagaTitulo ?? "Vaga não identificada");
}

interface ProcessamentosPageProps {
  searchParams?: Promise<ProcessamentoIaSearchParams>;
}

function AcoesCell({ item }: { item: ProcessamentoIaListItem }) {
  if (item.status === "falha") {
    // Ingestão só pode ser reprocessada enquanto o arquivo estiver retido;
    // falhas determinísticas (sem e-mail/celular) descartam o arquivo.
    const podeReprocessar =
      item.fluxo !== "ingestao_curriculo" || item.arquivoKey !== null;
    const curriculoDownloadUrl = getCurriculoDownloadUrl(item);

    if (!podeReprocessar) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }

    return (
      <div className="flex items-center justify-end gap-1">
        <RetryProcessamentoButton processamentoId={item.id} />
        {curriculoDownloadUrl ? (
          <a
            href={curriculoDownloadUrl}
            download
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
            aria-label="Baixar currículo"
            title="Baixar currículo"
          >
            <Download aria-hidden="true" />
            <span className="sr-only">Baixar currículo</span>
          </a>
        ) : null}
      </div>
    );
  }

  if (item.status === "sucesso") {
    if (
      (item.etapa === "classificador" || item.etapa === "extracao") &&
      item.candidatoId
    ) {
      return (
        <Link
          href={`/candidatos/${item.candidatoId}`}
          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          title="Ver candidato"
          aria-label="Ver candidato"
        >
          <UserRound aria-hidden="true" />
          <span className="sr-only">Ver candidato</span>
        </Link>
      );
    }
    if (item.etapa === "avaliador" && item.triagemId) {
      return (
        <Link
          href={`/triagens/${item.triagemId}`}
          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          title="Ver triagem"
          aria-label="Ver triagem"
        >
          <ClipboardCheck aria-hidden="true" />
          <span className="sr-only">Ver triagem</span>
        </Link>
      );
    }
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}

function buildColumns(): ColumnDef<ProcessamentoIaListItem>[] {
  return [
    {
      header: "Entidade",
      cell: (item) => (
        <span className="font-medium text-foreground">
          {descricaoEntidades(item)}
        </span>
      ),
    },
    {
      header: "Etapa",
      sortKey: "etapa",
      cell: (item) => (
        <span className="text-xs text-muted-foreground">
          {ETAPA_LABEL[item.etapa]}
        </span>
      ),
    },
    {
      header: "Status",
      sortKey: "status",
      cell: (item) => {
        const status = STATUS_CONFIG[item.status];
        return (
          <StatusBadge
            status={item.status}
            tone={status.tone}
            label={status.label}
          />
        );
      },
    },
    {
      header: "Tentativas",
      sortKey: "tentativas",
      headerClassName: "text-center",
      cellClassName: "text-center text-xs text-muted-foreground",
      cell: (item) => item.tentativas,
    },
    {
      header: "Início",
      sortKey: "iniciadoEm",
      cellClassName: "text-xs text-muted-foreground",
      cell: (item) => formatDate(item.iniciadoEm),
    },
    {
      header: "Conclusão",
      sortKey: "finalizadoEm",
      cellClassName: "text-xs text-muted-foreground",
      cell: (item) => formatDate(item.finalizadoEm),
    },
    {
      header: "Ações",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (item) => (
        <div className="flex justify-end">
          <AcoesCell item={item} />
        </div>
      ),
    },
  ];
}

async function ProcessamentosIaContent({
  searchParams,
}: {
  searchParams: ProcessamentoIaSearchParams;
}) {
  const parsedFluxo = processamentoIaFluxoSchema.safeParse(searchParams.fluxo);
  const fluxo: ProcessamentoFluxo = parsedFluxo.success
    ? parsedFluxo.data
    : "candidato_vagas";
  const page = parsePage(searchParams.page);
  const somenteFalhas = parseSomenteFalhas(searchParams.somenteFalhas);
  const sort = parseSort(searchParams, PROCESSAMENTO_SORT_KEYS);

  const [pageResult, summary] = await Promise.all([
    processamentoIaRepository.findPageByFluxo(
      fluxo,
      {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
      },
      { somenteFalhas, sort },
    ),
    processamentoIaRepository.getFluxoSummary(fluxo),
  ]);

  const totalPages = getTotalPages(pageResult.total, DEFAULT_PAGE_SIZE);
  if (pageResult.total > 0 && page > totalPages) {
    redirect(
      buildPageHref({
        pathname: "/processamentos-ia",
        searchParams,
        page: totalPages,
      }),
    );
  }

  const columns = buildColumns();

  return (
    <FluxoTabs value={fluxo}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="success" label={`${summary.sucessos} sucessos`} />
        <StatusBadge
          tone={summary.falhas > 0 ? "destructive" : "neutral"}
          label={`${summary.falhas} falhas`}
        />
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          <RetryUltimasFalhasButton
            fluxo={fluxo}
            falhasDisponiveis={summary.falhasReprocessaveis}
          />
          <SomenteFalhasCheckbox checked={somenteFalhas} />
        </div>
      </div>

      {pageResult.items.length === 0 ? (
        <DataEmptyState
          title={
            somenteFalhas
              ? "Nenhuma falha registrada"
              : "Nenhuma execução registrada"
          }
          description={
            somenteFalhas
              ? "Não há processamentos com falha neste fluxo."
              : "Os próximos processamentos deste fluxo aparecerão aqui."
          }
          className="py-8"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <DataTable
            columns={columns}
            rows={pageResult.items}
            className="block overflow-x-auto rounded-xl border border-border/60 bg-card shadow-xs"
          />
          <TablePagination
            pathname="/processamentos-ia"
            searchParams={searchParams}
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={pageResult.total}
            itemLabel="processamentos"
          />
        </div>
      )}
    </FluxoTabs>
  );
}

function ProcessamentosIaFallback() {
  return (
    <div className="flex flex-col gap-4" aria-label="Carregando processamentos">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

export default async function ProcessamentosIaPage(
  props: ProcessamentosPageProps,
) {
  const searchParams = props.searchParams ? await props.searchParams : {};

  return (
    <div className="container mx-auto flex max-w-7xl flex-col gap-5 p-4">
      <PageHeader
        title="Processamentos de IA"
        description="Acompanhe sucessos e falhas da ingestão de currículos e dos fluxos de matching e tente novamente quando necessário."
        className="mb-0"
      />
      <React.Suspense
        key={JSON.stringify(searchParams)}
        fallback={<ProcessamentosIaFallback />}
      >
        <ProcessamentosIaContent searchParams={searchParams} />
      </React.Suspense>
    </div>
  );
}
