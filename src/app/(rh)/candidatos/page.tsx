import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Users,
  UserCheck,
  Mail,
  Eye,
  MapPin,
  Phone,
  Briefcase,
  UploadCloud,
} from "lucide-react";
import { PageHeader } from "~/components/page-header";
import { DataEmptyState } from "~/components/data-empty-state";
import { buttonVariants } from "~/components/ui/button";
import { StatusBadge, type StatusTone } from "~/components/status-badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { Card, CardContent } from "~/components/ui/card";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { DeleteCandidatoButton } from "./_components/delete-candidato-button";
import { CandidatosFilter } from "./_components/candidatos-filter";
import { getWhatsAppUrl } from "~/lib/whatsapp";

export const dynamic = "force-dynamic";

interface CandidatosPageProps {
  searchParams?: Promise<{ q?: string; origem?: string; pool?: string }>;
}

export default async function CandidatosPage(props: CandidatosPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const query = (searchParams.q ?? "").trim().toLowerCase();
  const origemFilter = (searchParams.origem ?? "").trim().toLowerCase();
  const poolFilter = (searchParams.pool ?? "").trim().toLowerCase();

  const allCandidatos = await candidatoRepository.findAllActiveSummary();

  const manualCount = allCandidatos.filter((c) => c.origem === "manual").length;
  const emailCount = allCandidatos.filter((c) => c.origem === "email").length;

  const filteredCandidatos = allCandidatos.filter((candidato) => {
    const matchesQuery =
      !query ||
      candidato.nome.toLowerCase().includes(query) ||
      (candidato.email?.toLowerCase().includes(query) ?? false) ||
      candidato.cidade.toLowerCase().includes(query) ||
      candidato.uf.toLowerCase().includes(query) ||
      (candidato.cargoInteresse &&
        candidato.cargoInteresse.toLowerCase().includes(query));

    const matchesOrigem =
      !origemFilter ||
      origemFilter === "todas" ||
      candidato.origem === origemFilter;

    const matchesPool =
      !poolFilter || poolFilter === "todos" || candidato.emBancoTalentos;

    return matchesQuery && matchesOrigem && matchesPool;
  });

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

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1)
      return (parts[0]?.substring(0, 2) ?? "").toUpperCase();
    const first = parts[0]?.charAt(0) ?? "";
    const last = parts[parts.length - 1]?.charAt(0) ?? "";
    return `${first}${last}`.toUpperCase();
  };

  const getOrigemBadge = (origem: string) => {
    switch (origem) {
      case "email":
        return { label: "E-mail (IA)", tone: "info" as StatusTone };
      case "indicacao":
        return { label: "Indicação", tone: "success" as StatusTone };
      case "manual":
      default:
        return { label: "Manual", tone: "neutral" as StatusTone };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <PageHeader
        title="Candidatos"
        description="Gerencie os profissionais cadastrados, histórico de triagens e talentos da organização."
        actions={
          <>
            <Link
              href="/candidatos/upload-lote"
              className={buttonVariants({ variant: "outline" })}
            >
              <UploadCloud className="size-4 mr-2" aria-hidden="true" />
              Upload em Lote
            </Link>
            <Link
              href="/candidatos/novo"
              className={buttonVariants({ variant: "outline" })}
            >
              <Plus className="size-4 mr-2" aria-hidden="true" />
              Novo Candidato
            </Link>
          </>
        }
      />

      {allCandidatos.length === 0 ? (
        <DataEmptyState
          icon={Users}
          title="Nenhum candidato cadastrado"
          description="Cadastre novos candidatos manualmente ou aguarde a ingestão automática de currículos."
          action={
            <Link
              href="/candidatos/novo"
              className={buttonVariants({ variant: "default" })}
            >
              <Plus className="size-4 mr-2" aria-hidden="true" />
              Criar Candidato
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
                    Total de Candidatos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {allCandidatos.length}
                  </p>
                </div>
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Via E-mail / IA
                  </p>
                  <p className="text-2xl font-bold text-info">{emailCount}</p>
                </div>
                <div className="size-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
                  <Mail className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Cadastro Manual / RH
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {manualCount}
                  </p>
                </div>
                <div className="size-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                  <UserCheck className="size-5" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
            <CandidatosFilter />
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {filteredCandidatos.length === allCandidatos.length ? (
                <span>
                  Total de{" "}
                  <strong className="font-semibold text-foreground">
                    {allCandidatos.length}
                  </strong>{" "}
                  {allCandidatos.length === 1 ? "candidato" : "candidatos"}
                </span>
              ) : (
                <span>
                  Mostrando{" "}
                  <strong className="font-semibold text-foreground">
                    {filteredCandidatos.length}
                  </strong>{" "}
                  de {allCandidatos.length} candidatos
                </span>
              )}
            </div>
          </div>

          {filteredCandidatos.length === 0 ? (
            <DataEmptyState
              title="Nenhum candidato encontrado"
              description={`Nenhum resultado corresponde aos filtros aplicados.`}
              action={
                <Link
                  href="/candidatos"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Limpar filtros
                </Link>
              }
            />
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden md:block rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">
                        Candidato
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">
                        Localidade
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">
                        Cargo de Interesse
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">
                        Origem
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                        Cadastro
                      </TableHead>
                      <TableHead className="w-[100px] text-right font-semibold text-xs uppercase tracking-wider">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidatos.map((candidato) => {
                      const origemConfig = getOrigemBadge(candidato.origem);
                      return (
                        <TableRow
                          key={candidato.id}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                                {getInitials(candidato.nome)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <Link
                                  href={`/candidatos/${candidato.id}`}
                                  className="font-medium text-foreground hover:text-primary transition-colors text-sm truncate"
                                >
                                  {candidato.nome}
                                </Link>
                                <span className="text-xs text-muted-foreground truncate">
                                  {candidato.email}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Phone className="size-3" />
                                  <a
                                    href={getWhatsAppUrl(candidato.celular)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors"
                                  >
                                    {candidato.celular}
                                  </a>
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
                              <span>
                                {candidato.cidade}, {candidato.uf}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {candidato.cargoInteresse ? (
                              <span className="text-xs font-medium text-foreground">
                                {candidato.cargoInteresse}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Não informado
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <StatusBadge
                                tone={origemConfig.tone}
                                label={origemConfig.label}
                              />
                              {candidato.emBancoTalentos && (
                                <StatusBadge status="banco_talentos" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(candidato.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/candidatos/${candidato.id}`}
                                className={buttonVariants({
                                  variant: "ghost",
                                  size: "icon-xs",
                                  className:
                                    "text-muted-foreground hover:text-foreground",
                                })}
                                title="Ver detalhes do candidato"
                              >
                                <Eye className="size-3.5" />
                              </Link>
                              <DeleteCandidatoButton
                                candidatoId={candidato.id}
                                candidatoNome={candidato.nome}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredCandidatos.map((candidato) => {
                  const origemConfig = getOrigemBadge(candidato.origem);
                  return (
                    <Card
                      key={candidato.id}
                      className="border-border/60 shadow-xs hover:border-border transition-colors"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                              {getInitials(candidato.nome)}
                            </div>
                            <div>
                              <Link
                                href={`/candidatos/${candidato.id}`}
                                className="font-semibold text-sm text-foreground hover:text-primary transition-colors block"
                              >
                                {candidato.nome}
                              </Link>
                              <span className="text-xs text-muted-foreground block">
                                {candidato.email}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <StatusBadge
                              tone={origemConfig.tone}
                              label={origemConfig.label}
                            />
                            {candidato.emBancoTalentos && (
                              <StatusBadge status="banco_talentos" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
                          <div className="flex items-center gap-1.5">
                            <Phone className="size-3.5 text-muted-foreground/70" />
                            <a
                              href={getWhatsAppUrl(candidato.celular)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors"
                            >
                              {candidato.celular}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-muted-foreground/70" />
                            <span>
                              {candidato.cidade}, {candidato.uf}
                            </span>
                          </div>
                          {candidato.cargoInteresse && (
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="size-3.5 text-muted-foreground/70" />
                              <span className="font-medium text-foreground">
                                {candidato.cargoInteresse}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                          <span className="text-muted-foreground">
                            Cadastrado em {formatDate(candidato.createdAt)}
                          </span>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/candidatos/${candidato.id}`}
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                                className: "h-8 px-2.5 text-xs",
                              })}
                            >
                              <Eye className="size-3.5 mr-1" />
                              Ver Detalhes
                            </Link>
                            <DeleteCandidatoButton
                              candidatoId={candidato.id}
                              candidatoNome={candidato.nome}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
