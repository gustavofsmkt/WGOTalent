import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { Card, CardContent } from "~/components/ui/card";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { DeleteCandidatoButton } from "./_components/delete-candidato-button";
import { PageFilter } from "~/components/page-filter";
import { getWhatsAppUrl } from "~/lib/whatsapp";
import MetricCardsSummary from "~/components/metric-cards-summary";
import { DataTable, type ColumnDef } from "~/components/data-table";
import { TablePagination } from "~/components/table-pagination";
import { origemEnum } from "~/server/db/schema";
import {
  buildPageHref,
  DEFAULT_PAGE_SIZE,
  getTotalPages,
  parsePage,
} from "~/lib/pagination";

const ORIGEM_OPTIONS = [
  { value: "todas", label: "Todas as origens" },
  { value: "manual", label: "Manual (RH)" },
  { value: "email", label: "E-mail (IA)" },
  { value: "indicacao", label: "Indicação" },
];

const POOL_OPTIONS = [
  { value: "todos", label: "Todos os candidatos" },
  { value: "banco_talentos", label: "Banco de Talentos" },
];

export const dynamic = "force-dynamic";

interface CandidatosPageProps {
  searchParams?: Promise<{
    q?: string;
    origem?: string;
    pool?: string;
    page?: string;
  }>;
}

export default async function CandidatosPage(props: CandidatosPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const query = (searchParams.q ?? "").trim();
  const origemFilter = (searchParams.origem ?? "").trim().toLowerCase();
  const poolFilter = (searchParams.pool ?? "").trim().toLowerCase();
  const page = parsePage(searchParams.page);
  const origem = origemEnum.enumValues.find((value) => value === origemFilter);

  const [candidatosPage, summary] = await Promise.all([
    candidatoRepository.findPageActiveSummary(
      {
        query,
        origem,
        emBancoTalentos: poolFilter === "banco_talentos",
      },
      { page, pageSize: DEFAULT_PAGE_SIZE },
    ),
    candidatoRepository.getListSummary(),
  ]);
  const totalPages = getTotalPages(candidatosPage.total, DEFAULT_PAGE_SIZE);
  if (candidatosPage.total > 0 && page > totalPages) {
    redirect(
      buildPageHref({
        pathname: "/candidatos",
        searchParams,
        page: totalPages,
      }),
    );
  }

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

  type Candidato = (typeof candidatosPage.items)[number];

  const columns: ColumnDef<Candidato>[] = [
    {
      header: "Candidato",
      cell: (candidato) => (
        <div className="flex items-center gap-4">
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
            <span className="text-xs text-muted-foreground flex items-center gap-2 ">
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
      ),
    },
    {
      header: "Localidade",
      cell: (candidato) => (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
          <span>
            {candidato.cidade}, {candidato.uf}
          </span>
        </div>
      ),
    },
    {
      header: "Cargo de Interesse",
      cell: (candidato) =>
        candidato.cargoInteresse ? (
          <span className="text-xs font-medium text-foreground">
            {candidato.cargoInteresse}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Não informado
          </span>
        ),
    },
    {
      header: "Origem",
      cell: (candidato) => {
        const origemConfig = getOrigemBadge(candidato.origem);
        return (
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={origemConfig.tone} label={origemConfig.label} />
            {candidato.emBancoTalentos && (
              <StatusBadge status="banco_talentos" />
            )}
          </div>
        );
      },
    },
    {
      header: "Cadastro",
      cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
      cell: (candidato) => formatDate(candidato.createdAt),
    },
    {
      header: "Ações",
      headerClassName: "w-[60px]",
      cell: (candidato) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/candidatos/${candidato.id}`}
            className={buttonVariants({
              variant: "ghost",
              size: "icon-xs",
              className: "text-muted-foreground hover:text-foreground",
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
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-7xl mx-auto w-full space-y-4">
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

      {summary.total === 0 ? (
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
          <MetricCardsSummary
            cards={[
              {
                title: "Total de Candidatos",
                info: summary.total.toString(),
                icon: <Users className="size-5" />,
                iconColor: "bg-primary/10",
              },
              {
                title: "Via E-mail / IA",
                info: summary.email.toString(),
                icon: <Mail className="size-5" />,
                iconColor: "bg-info/10",
              },
              {
                title: "Cadastro Manual / RH",
                info: summary.manual.toString(),
                icon: <UserCheck className="size-5" />,
                iconColor: "bg-muted",
              },
            ]}
          />

          <PageFilter
            searchPlaceholder="Buscar por nome, e-mail, cidade ou cargo..."
            searchAriaLabel="Buscar candidato por nome, e-mail, cidade ou cargo"
            filterBar={{
              selects: [
                {
                  paramKey: "origem",
                  defaultValue: "todas",
                  placeholder: "Origem",
                  options: ORIGEM_OPTIONS,
                },
                {
                  paramKey: "pool",
                  defaultValue: "todos",
                  placeholder: "Banco de Talentos",
                  options: POOL_OPTIONS,
                },
              ],
            }}
          />

          {candidatosPage.items.length === 0 ? (
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
              <DataTable columns={columns} rows={candidatosPage.items} />

              {/* Mobile card list */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {candidatosPage.items.map((candidato) => {
                  const origemConfig = getOrigemBadge(candidato.origem);
                  return (
                    <Card
                      key={candidato.id}
                      className="border-border/60 shadow-xs hover:border-border transition-colors"
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-4">
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
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <StatusBadge
                              tone={origemConfig.tone}
                              label={origemConfig.label}
                            />
                            {candidato.emBancoTalentos && (
                              <StatusBadge status="banco_talentos" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/40">
                          <div className="flex items-center gap-2">
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
                          <div className="flex items-center gap-2">
                            <MapPin className="size-3.5 text-muted-foreground/70" />
                            <span>
                              {candidato.cidade}, {candidato.uf}
                            </span>
                          </div>
                          {candidato.cargoInteresse && (
                            <div className="flex items-center gap-2">
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
                                className: "h-8 px-2 text-xs",
                              })}
                            >
                              <Eye className="size-3.5 mr-2" />
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
              <TablePagination
                pathname="/candidatos"
                searchParams={searchParams}
                page={page}
                pageSize={DEFAULT_PAGE_SIZE}
                total={candidatosPage.total}
                itemLabel="candidatos"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
