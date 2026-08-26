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
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
      {ETAPAS.map((etapaDef) => {
        const etapaItems = items.filter(
          (item) => item.etapa === etapaDef.value,
        );

        return (
          <div
            key={etapaDef.value}
            className="flex flex-col gap-4 w-[320px] shrink-0 bg-muted/40 rounded-xl p-2 border border-border/70"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-2 bg-background rounded-lg border border-border/60">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${etapaDef.dotColor}`}
                  aria-hidden="true"
                />
                <h2 className="text-sm font-semibold text-foreground">
                  {etapaDef.label}
                </h2>
              </div>
              <span className="px-2  text-xs font-semibold rounded-md bg-muted text-muted-foreground border border-border/50">
                {etapaItems.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="flex flex-col gap-4 min-h-[150px] overflow-y-auto max-h-[360px]">
              {etapaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
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
    <Card className="shrink-0 border-border/80 bg-card">
      <CardContent className="group flex flex-col gap-2 px-4">
        {/* Candidate Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {getInitials(item.candidato.nome)}
            </div>
            <div className="min-w-0">
              <Link
                href={`/triagens/${item.id}`}
                className="font-medium text-sm text-foreground hover:underline block truncate"
              >
                {item.candidato.nome
                  .split(" ")
                  .map((n) => n.charAt(0).toLocaleUpperCase() + n.slice(1))
                  .join(" ")}
              </Link>
              <p className="text-xs text-muted-foreground truncate">
                {item.candidato.email}
              </p>
            </div>
          </div>
          <DeleteTriagemButton
            triagemId={item.id}
            candidatoNome={item.candidato.nome.split(" ")[0]}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Job opening details */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2 rounded-md border border-border/40">
          <div className="flex items-center gap-2 text-foreground font-medium truncate">
            <Briefcase className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{item.vaga.cargoTitulo}</span>
            {item.avaliacaoIa && (
              <span
                className="inline-flex items-center gap-2 px-2 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 shrink-0"
                title={`Score IA: ${item.avaliacaoIa.scoreIa}/100`}
              >
                <Sparkles className="size-3 text-primary" />
                <span>{Math.round(Number(item.avaliacaoIa.scoreIa))}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] truncate">
            <span className="truncate">{item.vaga.departamentoNome}</span>
            <span>•</span>
            <span>
              {item.vaga.cidade}/{item.vaga.uf}
            </span>
          </div>
        </div>

        {/* Card Footer: Date & Details link */}
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground ">
          <span className="flex items-center">
            {formatDate(item.createdAt)}
          </span>
          <Link
            href={`/triagens/${item.id}`}
            className="text-primary hover:underline font-medium inline-flex items-center "
          >
            Detalhes
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
