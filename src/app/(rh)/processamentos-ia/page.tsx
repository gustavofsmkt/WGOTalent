import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, FileText } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { StatusBadge, type StatusTone } from "~/components/status-badge";
import { buttonVariants } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { DataTable, type ColumnDef } from "~/components/data-table";
import { TablePagination } from "~/components/table-pagination";
import {
  processamentoIaRepository,
  type ProcessamentoIaListItem,
} from "~/server/db/repositories/processamento-ia";
import {
  buildPageHref,
  DEFAULT_PAGE_SIZE,
  getTotalPages,
  parsePage,
  type SearchParamsRecord,
} from "~/lib/pagination";
import { processamentoIaFluxoSchema } from "~/lib/validation/processamento-ia";
import { FluxoTabs, type ProcessamentoFluxo } from "./_components/fluxo-tabs";
import { RetryProcessamentoButton } from "./_components/retry-processamento-button";
import { RetryUltimasFalhasButton } from "./_components/retry-ultimas-falhas-button";

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

interface ProcessamentosSearchParams extends SearchParamsRecord {
  fluxo?: string;
  page?: string;
}

interface ProcessamentosPageProps {
  searchParams?: Promise<ProcessamentosSearchParams>;
}

function AcoesCell({ item }: { item: ProcessamentoIaListItem }) {
  if (item.status === "falha") {
    // Ingestão só pode ser reprocessada enquanto o arquivo estiver retido;
    // falhas determinísticas (sem e-mail/celular) descartam o arquivo.
    const podeReprocessar =
      item.fluxo !== "ingestao_curriculo" || item.arquivoKey !== null;
    return podeReprocessar ? (
      <RetryProcessamentoButton processamentoId={item.id} />
    ) : (
      <span className="text-xs text-muted-foreground">Sem reprocessamento</span>
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
          className={buttonVariants({ variant: "outline", size: "sm" })}
          title="Ver candidato"
        >
          <Eye data-icon="inline-start" />
          Ver candidato
        </Link>
      );
    }
    if (item.etapa === "avaliador" && item.triagemId) {
      return (
        <Link
          href={`/triagens/${item.triagemId}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
          title="Ver triagem"
        >
          <FileText data-icon="inline-start" />
          Ver triagem
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
      cell: (item) => (
        <span className="text-xs text-muted-foreground">
          {ETAPA_LABEL[item.etapa]}
        </span>
      ),
    },
    {
      header: "Status",
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
      headerClassName: "text-center",
      cellClassName: "text-center text-xs text-muted-foreground",
      cell: (item) => item.tentativas,
    },
    {
      header: "Início",
      cellClassName: "text-xs text-muted-foreground",
      cell: (item) => formatDate(item.iniciadoEm),
    },
    {
      header: "Conclusão",
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
  searchParams: ProcessamentosSearchParams;
}) {
  const parsedFluxo = processamentoIaFluxoSchema.safeParse(searchParams.fluxo);
  const fluxo: ProcessamentoFluxo = parsedFluxo.success
    ? parsedFluxo.data
    : "candidato_vagas";
  const page = parsePage(searchParams.page);

  const [pageResult, summary] = await Promise.all([
    processamentoIaRepository.findPageByFluxo(fluxo, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
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
        <RetryUltimasFalhasButton
          fluxo={fluxo}
          falhasDisponiveis={summary.falhasReprocessaveis}
        />
      </div>

      {pageResult.items.length === 0 ? (
        <DataEmptyState
          title="Nenhuma execução registrada"
          description="Os próximos processamentos deste fluxo aparecerão aqui."
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
