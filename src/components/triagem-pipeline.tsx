import Link from "next/link";
import { Sparkles, Briefcase, Building2, MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { StatusBadge } from "~/components/status-badge";
import type { TriagemListItem } from "~/server/db/repositories/triagem";
import { DeleteTriagemButton } from "~/app/(rh)/triagens/_components/delete-triagem-button";
import {
  ETAPAS,
  MOTIVO_LABELS,
  getInitials,
  formatDate,
} from "~/lib/triagem-format";

export function TriagemPipelineBoard({ items }: { items: TriagemListItem[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory">
      {ETAPAS.map((etapaDef) => {
        const etapaItems = items.filter(
          (item) => item.etapa === etapaDef.value,
        );

        return (
          <div
            key={etapaDef.value}
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
  );
}

function PipelineCard({ item }: { item: TriagemListItem }) {
  return (
    <Card className="shrink-0 shadow-xs hover:shadow-md transition-all duration-200 border-border/80 bg-card group">
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
