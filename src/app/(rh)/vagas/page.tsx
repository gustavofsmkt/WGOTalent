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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { Card, CardContent } from "~/components/ui/card";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { DeleteVagaButton } from "./_components/delete-vaga-button";
import { VagasFilter } from "./_components/vagas-filter";

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
      vaga.cidade.toLowerCase().includes(query) ||
      vaga.uf.toLowerCase().includes(query);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
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
          {/* Summary stats bento banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/60 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total de Vagas
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {allVagas.length}
                  </p>
                </div>
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Briefcase className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Vagas Abertas
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {totalAbertas}
                  </p>
                </div>
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Building2 className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Posições Totais
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalPosicoes}
                  </p>
                </div>
                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="size-5" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
            <VagasFilter />
            <div className="text-xs text-muted-foreground shrink-0">
              {filteredVagas.length === allVagas.length ? (
                <span>
                  Total de{" "}
                  <strong className="font-semibold text-foreground">
                    {allVagas.length}
                  </strong>{" "}
                  {allVagas.length === 1 ? "vaga" : "vagas"}
                </span>
              ) : (
                <span>
                  Mostrando{" "}
                  <strong className="font-semibold text-foreground">
                    {filteredVagas.length}
                  </strong>{" "}
                  de {allVagas.length} vagas
                </span>
              )}
            </div>
          </div>

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
              {/* Desktop View */}
              <div className="hidden md:block rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[260px]">
                        Cargo / Departamento
                      </TableHead>
                      <TableHead className="w-[180px]">Localização</TableHead>
                      <TableHead className="w-[100px]">Posições</TableHead>
                      <TableHead className="w-[150px]">Remuneração</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[120px]">Criada em</TableHead>
                      <TableHead className="w-[120px] text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVagas.map((vaga) => (
                      <TableRow
                        key={vaga.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/vagas/${vaga.id}`}
                            className="hover:text-primary hover:underline transition-colors block font-semibold text-foreground"
                          >
                            {vaga.cargo.titulo}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Building2 className="size-3" />
                            <span>{vaga.cargo.departamento.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                            <span>
                              {vaga.cidade} / {vaga.uf}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Users className="size-3.5 text-muted-foreground" />
                            <span>{vaga.posicoesDisponiveis}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          {formatCurrency(vaga.remuneracaoOferecida)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={vaga.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(vaga.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/vagas/${vaga.id}`}
                              className={buttonVariants({
                                variant: "ghost",
                                size: "icon-sm",
                                className:
                                  "text-muted-foreground hover:text-primary",
                              })}
                              title={`Ver detalhes da vaga`}
                              aria-label={`Ver detalhes da vaga`}
                            >
                              <Eye className="size-4" />
                            </Link>
                            <DeleteVagaButton
                              vagaId={vaga.id}
                              vagaTitulo={`${vaga.cargo.titulo} (${vaga.cidade}/${vaga.uf})`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                {filteredVagas.map((vaga) => (
                  <div
                    key={vaga.id}
                    className="flex flex-col p-4 bg-card rounded-xl border border-border/60 shadow-xs gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/vagas/${vaga.id}`}
                          className="font-semibold text-foreground hover:text-primary hover:underline line-clamp-1 text-base"
                        >
                          {vaga.cargo.titulo}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Building2 className="size-3" />
                          <span>{vaga.cargo.departamento.nome}</span>
                        </div>
                      </div>
                      <StatusBadge status={vaga.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        <span>
                          {vaga.cidade} / {vaga.uf}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span>
                          {vaga.posicoesDisponiveis}{" "}
                          {vaga.posicoesDisponiveis === 1
                            ? "posição"
                            : "posições"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
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
                          vagaTitulo={`${vaga.cargo.titulo} (${vaga.cidade}/${vaga.uf})`}
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
