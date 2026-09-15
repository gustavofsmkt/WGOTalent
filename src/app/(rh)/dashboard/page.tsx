import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Target,
  Users,
  ClipboardCheck,
  Sparkles,
  Plus,
  UploadCloud,
  ArrowUpRight,
  MapPin,
  CalendarClock,
  Eye,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { type StatusTone } from "~/components/status-badge";
import { DataEmptyState } from "~/components/data-empty-state";
import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { dashboardRepository } from "~/server/db/repositories/dashboard";
import { splitDataHora } from "~/lib/triagem-format";
import { cn } from "~/lib/utils";
import { TablePagination } from "~/components/table-pagination";
import {
  buildPaginationHref,
  DASHBOARD_PAGE_SIZE,
  getTotalPages,
  parsePage,
} from "~/lib/pagination";

export const dynamic = "force-dynamic";

const ETAPAS_CONFIG = [
  {
    key: "curriculo",
    label: "Currículo",
    color: "bg-blue-500",
    barColor: "bg-blue-500/20",
  },
  {
    key: "testes",
    label: "Testes",
    color: "bg-amber-500",
    barColor: "bg-amber-500/20",
  },
  {
    key: "entrevista_rh",
    label: "Entrevista RH",
    color: "bg-purple-500",
    barColor: "bg-purple-500/20",
  },
  {
    key: "entrevista_gestor",
    label: "Entrevista Gestor",
    color: "bg-indigo-500",
    barColor: "bg-indigo-500/20",
  },
  {
    key: "finalizado",
    label: "Finalizado",
    color: "bg-emerald-500",
    barColor: "bg-emerald-500/20",
  },
] as const;

const RESULTADOS_CONFIG = [
  {
    key: "em_andamento",
    label: "Em Andamento",
    tone: "info" as StatusTone,
    dotColor: "bg-blue-500",
    progressColor: "bg-blue-500",
  },
  {
    key: "aprovado",
    label: "Aprovados",
    tone: "success" as StatusTone,
    dotColor: "bg-emerald-500",
    progressColor: "bg-emerald-500",
  },
  {
    key: "reprovado",
    label: "Reprovados",
    tone: "destructive" as StatusTone,
    dotColor: "bg-rose-500",
    progressColor: "bg-rose-500",
  },
  {
    key: "desistente",
    label: "Desistentes",
    tone: "neutral" as StatusTone,
    dotColor: "bg-zinc-400",
    progressColor: "bg-zinc-400",
  },
  {
    key: "banco_talentos",
    label: "Banco de Talentos",
    tone: "warning" as StatusTone,
    dotColor: "bg-amber-500",
    progressColor: "bg-amber-500",
  },
] as const;

function formatDiasAberta(dias: number): string {
  if (dias <= 0) return "hoje";
  return `${dias} ${dias === 1 ? "dia" : "dias"}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1)
    return (parts[0]?.substring(0, 2) ?? "").toUpperCase();
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts[parts.length - 1]?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}

interface DashboardPageProps {
  searchParams?: Promise<{
    topVagasPage?: string;
    activityPage?: string;
  }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const topVagasPage = parsePage(searchParams.topVagasPage);
  const activityPage = parsePage(searchParams.activityPage);
  const summary = await dashboardRepository.getDashboardSummary({
    topVagas: { page: topVagasPage, pageSize: DASHBOARD_PAGE_SIZE },
    atividade: { page: activityPage, pageSize: DASHBOARD_PAGE_SIZE },
  });
  const topVagasTotalPages = getTotalPages(
    summary.vagasMaisAntigas.total,
    DASHBOARD_PAGE_SIZE,
  );
  const activityTotalPages = getTotalPages(
    summary.proximasAtividades.total,
    DASHBOARD_PAGE_SIZE,
  );
  const invalidTopVagasPage =
    summary.vagasMaisAntigas.total > 0 && topVagasPage > topVagasTotalPages;
  const invalidActivityPage =
    summary.proximasAtividades.total > 0 && activityPage > activityTotalPages;

  if (invalidTopVagasPage || invalidActivityPage) {
    redirect(
      buildPaginationHref({
        pathname: "/dashboard",
        searchParams,
        pages: {
          topVagasPage: invalidTopVagasPage ? topVagasTotalPages : topVagasPage,
          activityPage: invalidActivityPage ? activityTotalPages : activityPage,
        },
        hash: invalidTopVagasPage
          ? "vagas-mais-antigas"
          : "proximas-atividades",
      }),
    );
  }

  const totalEtapas = Object.values(summary.triagensPorEtapa).reduce(
    (acc, count) => acc + count,
    0,
  );
  const maxEtapaCount = Math.max(...Object.values(summary.triagensPorEtapa), 1);
  const totalResultados = summary.triagensTotais;

  return (
    <div className="container mx-auto p-4 md:p-4 lg:p-4 max-w-7xl space-y-4">
      <PageHeader
        title="Dashboard"
        description="Visão geral estratégica e operacional de recrutamento, triagens e aderência por IA."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/candidatos/upload-lote"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload em Lote
            </Link>
            <Link
              href="/vagas/novo"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Vaga
            </Link>
            <Link
              href="/candidatos/novo"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Candidato
            </Link>
          </div>
        }
      />

      {/* 1. KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vagas Abertas */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Vagas Abertas
            </CardTitle>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Target className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {summary.vagasAbertas}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <span>Posições ativas</span>
              <Link
                href="/vagas"
                className="text-primary hover:underline font-medium inline-flex items-center "
              >
                Ver vagas
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Candidatos Ativos */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Candidatos Ativos
            </CardTitle>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {summary.candidatosAtivos.toLocaleString("pt-BR")}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <span>No banco de talentos</span>
              <Link
                href="/candidatos"
                className="text-primary hover:underline font-medium inline-flex items-center "
              >
                Ver talentos
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Triagens em Andamento */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Triagens Ativas
            </CardTitle>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {summary.triagensEmAndamento}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <span>{summary.triagensTotais} triagens no histórico</span>
              <Link
                href="/triagens"
                className="text-primary hover:underline font-medium inline-flex items-center "
              >
                Pipeline
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Score Médio IA */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider">
              Score Médio IA
            </CardTitle>
            <div className="p-2 bg-primary text-primary-foreground rounded-lg shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-primary">
                {summary.mediaScoreIa.media !== null
                  ? summary.mediaScoreIa.media
                  : "—"}
              </span>
              {summary.mediaScoreIa.media !== null && (
                <span className="text-sm font-semibold text-muted-foreground">
                  /100
                </span>
              )}
            </div>
            <div className="mt-2 space-y-1">
              <div className="h-2 w-full bg-primary/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, summary.mediaScoreIa.media ?? 0))}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.mediaScoreIa.totalAvaliadas > 0
                  ? `${summary.mediaScoreIa.totalAvaliadas} avaliações realizadas`
                  : "Nenhuma avaliação computada"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Visão de Funil e Distribuição de Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Triagens por Etapa (Funil) - Ocupa 2 colunas no desktop */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Triagens por Etapa do Funil
                </CardTitle>
                <CardDescription>
                  Distribuição de candidatos em cada fase do processo seletivo (
                  {totalEtapas} no funil)
                </CardDescription>
              </div>
              <Link
                href="/triagens"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-2"
              >
                Ver pipeline completo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {totalEtapas === 0 ? (
              <DataEmptyState
                title="Sem triagens registradas"
                description="Cadastre candidatos e vagas para acompanhar o fluxo das etapas de triagem."
                className="py-10 border-0"
              />
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center">
                  {ETAPAS_CONFIG.map((etapa) => {
                    const count = summary.triagensPorEtapa[etapa.key] ?? 0;
                    const heightPercent =
                      totalEtapas > 0
                        ? Math.max(
                            12,
                            Math.round((count / maxEtapaCount) * 100),
                          )
                        : 0;
                    const percentageOfTotal =
                      totalEtapas > 0
                        ? Math.round((count / totalEtapas) * 100)
                        : 0;

                    return (
                      <div
                        key={etapa.key}
                        className="flex flex-col items-center gap-2"
                      >
                        {/* Vertical Bar Container */}
                        <div className="w-full h-36 bg-muted/40 rounded-lg p-1.5 flex flex-col justify-end items-center relative group">
                          <div
                            className={cn(
                              "w-full rounded-md transition-all duration-500 flex items-center justify-center text-xs font-bold text-white shadow-sm",
                              count > 0 ? etapa.color : "bg-muted",
                            )}
                            style={{ height: `${heightPercent}%` }}
                          >
                            {count > 0 && <span>{count}</span>}
                          </div>
                        </div>

                        {/* Label & Details */}
                        <div className="w-full">
                          <p
                            className="text-xs font-medium text-foreground truncate"
                            title={etapa.label}
                          >
                            {etapa.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {percentageOfTotal}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Triagens por Resultado */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Desfecho das Triagens
            </CardTitle>
            <CardDescription>
              Status de resolução de todos os processos ({totalResultados}{" "}
              totais)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {totalResultados === 0 ? (
              <DataEmptyState
                title="Sem resultados"
                description="Nenhuma triagem finalizada ou em andamento ainda."
                className="py-4 border-0"
              />
            ) : (
              <div className="space-y-2">
                {RESULTADOS_CONFIG.map((res) => {
                  const count = summary.triagensPorResultado[res.key] ?? 0;
                  const pct =
                    totalResultados > 0
                      ? Math.round((count / totalResultados) * 100)
                      : 0;

                  return (
                    <div key={res.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2 text-foreground">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              res.dotColor,
                            )}
                          />
                          {res.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {count}
                          </span>
                          <span className="text-muted-foreground">
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            res.progressColor,
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Tabelas de Vagas mais Antigas & Próximas Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vagas mais Antigas */}
        <Card id="vagas-mais-antigas" className="scroll-mt-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Vagas mais Antigas
              </CardTitle>
              <CardDescription>
                Posições abertas há mais tempo e ainda sem preenchimento
              </CardDescription>
            </div>
            <Link
              href="/vagas"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-2"
            >
              Ver todas
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {summary.vagasMaisAntigas.total === 0 ? (
              <div className="p-4">
                <DataEmptyState
                  title="Nenhuma vaga aberta"
                  description="Crie novas vagas para receber candidaturas e avaliações."
                  className="py-4 border-0"
                />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Cargo / Depto</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead className="text-center">Vagas</TableHead>
                      <TableHead className="text-center">Aberta há</TableHead>
                      <TableHead className="text-right">Em andamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.vagasMaisAntigas.items.map((vaga) => (
                      <TableRow key={vaga.vagaId} className="group">
                        <TableCell className="font-medium">
                          <Link
                            href={`/vagas/${vaga.vagaId}`}
                            className="hover:underline text-foreground block font-semibold truncate max-w-[200px] sm:max-w-[260px]"
                          >
                            {vaga.cargoTitulo}
                          </Link>
                          <span className="text-xs text-muted-foreground block truncate">
                            {vaga.departamentoNome}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {vaga.cidades
                              .map((c) => `${c.nome}/${c.uf}`)
                              .join(", ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="font-normal text-xs"
                          >
                            {vaga.posicoesDisponiveis}{" "}
                            {vaga.posicoesDisponiveis === 1 ? "vaga" : "vagas"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs whitespace-nowrap">
                          {formatDiasAberta(vaga.diasAberta)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="secondary"
                            className="font-semibold text-xs"
                          >
                            {vaga.triagensEmAndamento}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  pathname="/dashboard"
                  searchParams={searchParams}
                  page={topVagasPage}
                  pageSize={DASHBOARD_PAGE_SIZE}
                  total={summary.vagasMaisAntigas.total}
                  pageParam="topVagasPage"
                  hash="vagas-mais-antigas"
                  itemLabel="vagas"
                  className="border-t px-4 py-3"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Próximas Atividades */}
        <Card id="proximas-atividades" className="scroll-mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Próximas Atividades
            </CardTitle>
            <CardDescription>
              Testes e entrevistas agendados nas triagens em andamento
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {summary.proximasAtividades.total === 0 ? (
              <div className="p-4">
                <DataEmptyState
                  title="Nenhuma atividade agendada"
                  description="Marque a data e a hora dos testes e entrevistas na triagem para vê-las aqui."
                  className="py-4 border-0"
                />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">
                        Candidato / Vaga
                      </TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead className="text-right">
                        <span className="sr-only">Ações</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.proximasAtividades.items.map((item) => {
                      const { data, hora } = splitDataHora(item.dataHora);
                      const etapa = ETAPAS_CONFIG.find(
                        (e) => e.key === item.etapa,
                      );

                      return (
                        <TableRow key={`${item.triagemId}-${item.etapa}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                {getInitials(item.candidatoNome)}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/triagens/${item.triagemId}`}
                                  className="font-medium text-foreground hover:underline block text-sm truncate max-w-[150px] sm:max-w-[200px]"
                                >
                                  {item.candidatoNome}
                                </Link>
                                <span className="text-xs text-muted-foreground block truncate max-w-[150px] sm:max-w-[200px]">
                                  {item.cargoTitulo}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className={cn(
                                  "h-2.5 w-2.5 rounded-full shrink-0",
                                  etapa?.color ?? "bg-muted",
                                )}
                              />
                              {etapa?.label ?? item.etapa}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {data}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {hora}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/triagens/${item.triagemId}`}
                              className={buttonVariants({
                                variant: "ghost",
                                size: "icon-sm",
                                className:
                                  "text-muted-foreground hover:text-primary",
                              })}
                              title={`Ver triagem de ${item.candidatoNome}`}
                              aria-label={`Ver triagem de ${item.candidatoNome}`}
                            >
                              <Eye className="size-4" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <TablePagination
                  pathname="/dashboard"
                  searchParams={searchParams}
                  page={activityPage}
                  pageSize={DASHBOARD_PAGE_SIZE}
                  total={summary.proximasAtividades.total}
                  pageParam="activityPage"
                  hash="proximas-atividades"
                  itemLabel="atividades"
                  className="border-t px-4 py-3"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
