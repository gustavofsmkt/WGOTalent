import * as React from "react";
import Link from "next/link";
import { Plus, Sparkles, Eye, Layers, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { buttonVariants } from "~/components/ui/button";
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
  type TriagemFiltros,
} from "~/server/db/repositories/triagem";
import {
  triagemEtapaEnum,
  triagemResultadoEnum,
  triagemMotivoEnum,
} from "~/server/db/schema";
import { TriagemPipelineBoard } from "~/components/triagem-pipeline";
import { MOTIVO_LABELS, getInitials, formatDate } from "~/lib/triagem-format";
import { TriagensFilter } from "./_components/triagens-filter";
import { DeleteTriagemButton } from "./_components/delete-triagem-button";

export const dynamic = "force-dynamic";

function isEnumValue<T extends string>(
  values: readonly T[],
  value: string,
): value is T {
  return (values as readonly string[]).includes(value);
}

interface TriagensPageProps {
  searchParams?: Promise<{
    etapa?: string;
    resultado?: string;
    motivo?: string;
    q?: string;
    view?: string;
    vagaAtiva?: string;
    vaga?: string;
  }>;
}

export default async function TriagensPage(props: TriagensPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const query = (searchParams.q ?? "").trim().toLowerCase();
  const etapaFilter = (searchParams.etapa ?? "").trim().toLowerCase();
  const resultadoFilter = (searchParams.resultado ?? "").trim().toLowerCase();
  const motivoFilter = (searchParams.motivo ?? "").trim().toLowerCase();
  const currentView = searchParams.view === "lista" ? "lista" : "pipeline";
  const vagaAtivaFilter = searchParams.vagaAtiva === "1";
  const vagaFilter = (searchParams.vaga ?? "").trim();

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

  const [allTriagens, vagaOptions] = await Promise.all([
    triagemRepository.findAllWithJoins(
      Object.keys(dbFilter).length > 0 ? dbFilter : undefined,
    ),
    triagemRepository.findActiveVagaOptions(),
  ]);

  const filteredTriagens = allTriagens.filter((item) => {
    if (!query) return true;
    return (
      item.candidato.nome.toLowerCase().includes(query) ||
      (item.candidato.email?.toLowerCase().includes(query) ?? false) ||
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

      {allTriagens.length === 0 ? (
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
          <TriagensFilter vagaOptions={vagaOptions} />

          {/* Content View: Pipeline (Kanban) or Lista (Table) */}
          {filteredTriagens.length === 0 ? (
            <Card className="shadow-xs">
              <CardContent className="py-12">
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
              </CardContent>
            </Card>
          ) : currentView === "pipeline" ? (
            <TriagemPipelineBoard items={filteredTriagens} />
          ) : (
            /* Table / List View */
            <Card className="shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Candidato</TableHead>
                      <TableHead className="min-w-[200px]">
                        Vaga / Cargo
                      </TableHead>
                      <TableHead className="min-w-[120px]">Etapa</TableHead>
                      <TableHead className="min-w-[140px]">Resultado</TableHead>
                      <TableHead className="min-w-[100px]">Score IA</TableHead>
                      <TableHead className="min-w-[110px]">Data</TableHead>
                      <TableHead className="w-[100px] text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTriagens.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
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
                              {item.vaga.departamentoNome} • {item.vaga.cidade}/
                              {item.vaga.uf}
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
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
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
        </>
      )}
    </div>
  );
}
