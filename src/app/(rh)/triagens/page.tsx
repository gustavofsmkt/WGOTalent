import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Sparkles,
  Eye,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Briefcase,
  MapPin,
} from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { buttonVariants, Button } from "~/components/ui/button";
import { StatusBadge } from "~/components/status-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { Card, CardContent } from "~/components/ui/card";
import {
  triagemRepository,
  type TriagemListItem,
} from "~/server/db/repositories/triagem";
import { TriagensFilter } from "./_components/triagens-filter";
import { DeleteTriagemButton } from "./_components/delete-triagem-button";

export const dynamic = "force-dynamic";

const ETAPAS_PIPELINE = [
  { key: "curriculo", label: "Currículo", dotColor: "bg-blue-500" },
  { key: "testes", label: "Testes", dotColor: "bg-amber-500" },
  { key: "entrevista_rh", label: "Entrevista RH", dotColor: "bg-purple-500" },
  { key: "entrevista_gestor", label: "Entrevista Gestor", dotColor: "bg-indigo-500" },
  { key: "finalizado", label: "Finalizado", dotColor: "bg-emerald-500" },
] as const;

const MOTIVO_LABELS: Record<string, string> = {
  curriculo: "Currículo / Perfil",
  fit_cultural: "Fit Cultural",
  testes: "Testes Técnicos",
  rh: "Avaliação RH",
  gestor: "Avaliação Gestor",
  incompatibilidade_salarial: "Incompatibilidade Salarial",
  aceitou_outra_proposta: "Outra Proposta",
  nao_atendeu_contato: "Não Atendeu Contato",
  motivos_pessoais: "Motivos Pessoais",
};

interface TriagensPageProps {
  searchParams?: Promise<{
    etapa?: string;
    resultado?: string;
    motivo?: string;
    q?: string;
    view?: string;
  }>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.substring(0, 2) ?? "").toUpperCase();
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts[parts.length - 1]?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "";
  }
}

export default async function TriagensPage(props: TriagensPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const query = (searchParams.q ?? "").trim().toLowerCase();
  const etapaFilter = (searchParams.etapa ?? "").trim().toLowerCase();
  const resultadoFilter = (searchParams.resultado ?? "").trim().toLowerCase();
  const motivoFilter = (searchParams.motivo ?? "").trim().toLowerCase();
  const currentView = searchParams.view === "lista" ? "lista" : "pipeline";

  const dbFilter: { etapa?: string; resultado?: string; motivo?: string } = {};
  if (etapaFilter && etapaFilter !== "todas") {
    dbFilter.etapa = etapaFilter;
  }
  if (resultadoFilter && resultadoFilter !== "todas") {
    dbFilter.resultado = resultadoFilter;
  }
  if (motivoFilter && motivoFilter !== "todos") {
    dbFilter.motivo = motivoFilter;
  }

  const allTriagens = await triagemRepository.findAllWithJoins(
    Object.keys(dbFilter).length > 0 ? dbFilter : undefined,
  );

  const filteredTriagens = allTriagens.filter((item) => {
    if (!query) return true;
    return (
      item.candidato.nome.toLowerCase().includes(query) ||
      item.candidato.email.toLowerCase().includes(query) ||
      item.vaga.cargoTitulo.toLowerCase().includes(query) ||
      item.vaga.departamentoNome.toLowerCase().includes(query) ||
      item.vaga.cidade.toLowerCase().includes(query) ||
      item.vaga.uf.toLowerCase().includes(query)
    );
  });

  const totalCount = filteredTriagens.length;
  const emAndamentoCount = filteredTriagens.filter(
    (t) => t.resultado === "em_andamento",
  ).length;
  const aprovadosCount = filteredTriagens.filter(
    (t) => t.resultado === "aprovado",
  ).length;

  const hasActiveFilters =
    Boolean(query) ||
    (etapaFilter && etapaFilter !== "todas") ||
    (resultadoFilter && resultadoFilter !== "todas") ||
    (motivoFilter && motivoFilter !== "todos");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
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

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total de Triagens
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {totalCount}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Em Andamento
              </p>
              <p className="text-2xl font-bold tracking-tight text-info">
                {emAndamentoCount}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-info/10 flex items-center justify-center text-info">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Aprovados
              </p>
              <p className="text-2xl font-bold tracking-tight text-success">
                {aprovadosCount}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TriagensFilter />

      {/* Content View: Pipeline (Kanban) or Lista (Table) */}
      {filteredTriagens.length === 0 ? (
        <Card className="shadow-xs">
          <CardContent className="py-12">
            <DataEmptyState
              title={
                hasActiveFilters
                  ? "Nenhuma triagem encontrada"
                  : "Nenhuma triagem cadastrada"
              }
              description={
                hasActiveFilters
                  ? "Tente ajustar ou limpar os filtros para visualizar outras triagens."
                  : "Inicie o processo seletivo criando uma nova triagem de candidato para uma vaga."
              }
              action={
                hasActiveFilters ? (
                  <Link
                    href="/triagens"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Limpar filtros
                  </Link>
                ) : (
                  <Link
                    href="/triagens/nova"
                    className={buttonVariants({ variant: "default" })}
                  >
                    <Plus className="size-4 mr-2" aria-hidden="true" />
                    Nova Triagem
                  </Link>
                )
              }
            />
          </CardContent>
        </Card>
      ) : currentView === "pipeline" ? (
        /* Pipeline / Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory">
          {ETAPAS_PIPELINE.map((etapaDef) => {
            const etapaItems = filteredTriagens.filter(
              (item) => item.etapa === etapaDef.key,
            );

            return (
              <div
                key={etapaDef.key}
                className="flex flex-col gap-3 min-w-[300px] max-w-[340px] w-[320px] shrink-0 snap-center bg-muted/40 rounded-xl p-3 border border-border/70"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-1.5 bg-background rounded-lg border border-border/60 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2.5 rounded-full ${etapaDef.dotColor}`}
                      aria-hidden="true"
                    />
                    <h2 className="text-sm font-semibold text-foreground">
                      {etapaDef.label}
                    </h2>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-muted text-muted-foreground border border-border/50">
                    {etapaItems.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex flex-col gap-3 min-h-[150px] overflow-y-auto max-h-[calc(100vh-360px)] pr-0.5">
                  {etapaItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
                      Nenhum candidato nesta etapa
                    </div>
                  ) : (
                    etapaItems.map((item) => (
                      <PipelineCard key={item.id} item={item} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / List View */
        <Card className="shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Candidato</TableHead>
                  <TableHead className="min-w-[200px]">Vaga / Cargo</TableHead>
                  <TableHead className="min-w-[120px]">Etapa</TableHead>
                  <TableHead className="min-w-[140px]">Resultado</TableHead>
                  <TableHead className="min-w-[100px]">Score IA</TableHead>
                  <TableHead className="min-w-[110px]">Data</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTriagens.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
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
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground text-xs">
                          {item.vaga.cargoTitulo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.vaga.departamentoNome} • {item.vaga.cidade}/{item.vaga.uf}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={item.etapa} />
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge status={item.resultado} />
                        {item.motivo && MOTIVO_LABELS[item.motivo] && (
                          <p className="text-[11px] text-muted-foreground">
                            {MOTIVO_LABELS[item.motivo]}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {item.avaliacaoIa ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                          title={item.avaliacaoIa.parecerIa || undefined}
                        >
                          <Sparkles className="size-3 text-primary" />
                          {Math.round(Number(item.avaliacaoIa.scoreIa))}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

function PipelineCard({ item }: { item: TriagemListItem }) {
  return (
    <Card className="shadow-xs hover:shadow-md transition-all duration-200 border-border/80 bg-card group">
      <CardContent className="p-3.5 space-y-3">
        {/* Candidate Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {getInitials(item.candidato.nome)}
            </div>
            <div className="min-w-0">
              <Link
                href={`/triagens/${item.id}`}
                className="font-medium text-sm text-foreground hover:underline block truncate"
              >
                {item.candidato.nome}
              </Link>
              <p className="text-xs text-muted-foreground truncate">
                {item.candidato.email}
              </p>
            </div>
          </div>
          <DeleteTriagemButton
            triagemId={item.id}
            candidatoNome={item.candidato.nome}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Job opening details */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2 rounded-md border border-border/40">
          <div className="flex items-center gap-1.5 text-foreground font-medium truncate">
            <Briefcase className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{item.vaga.cargoTitulo}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] truncate">
            <Building2 className="size-3 text-muted-foreground shrink-0" />
            <span className="truncate">{item.vaga.departamentoNome}</span>
            <span>•</span>
            <MapPin className="size-3 text-muted-foreground shrink-0" />
            <span>
              {item.vaga.cidade}/{item.vaga.uf}
            </span>
          </div>
        </div>

        {/* Badges & Score */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={item.resultado} />

            {item.motivo && MOTIVO_LABELS[item.motivo] && (
              <span className="inline-block text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                {MOTIVO_LABELS[item.motivo]}
              </span>
            )}
          </div>

          {item.avaliacaoIa && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 shrink-0"
              title={`Score IA: ${item.avaliacaoIa.scoreIa}/100`}
            >
              <Sparkles className="size-3 text-primary" />
              <span>{Math.round(Number(item.avaliacaoIa.scoreIa))}</span>
            </span>
          )}
        </div>

        {/* Card Footer: Date & Details link */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {formatDate(item.createdAt)}
          </span>
          <Link
            href={`/triagens/${item.id}`}
            className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
          >
            Detalhes
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

