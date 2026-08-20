import * as React from "react";
import Link from "next/link";
import { GitBranch, Sparkles, Calendar, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { StatusBadge } from "~/components/status-badge";
import { buttonVariants } from "~/components/ui/button";
import type { CandidatoDetailCompleto } from "~/server/db/repositories/candidato";
import { PARECER_FIELD_BY_ETAPA } from "~/lib/triagem-format";

interface CandidateScreeningsProps {
  triagens: CandidatoDetailCompleto["triagens"];
}

export function CandidateScreenings({ triagens }: CandidateScreeningsProps) {
  const formatDate = (dateStr: string | Date) => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return "";
    }
  };

  const formatMotivo = (motivo?: string | null) => {
    switch (motivo) {
      case "curriculo":
        return "Currículo não aderente";
      case "fit_cultural":
        return "Fit cultural";
      case "testes":
        return "Reprovação em testes";
      case "rh":
        return "Parecer RH";
      case "gestor":
        return "Parecer Gestor";
      case "incompatibilidade_salarial":
        return "Incompatibilidade salarial";
      case "aceitou_outra_proposta":
        return "Aceitou outra proposta";
      case "nao_atendeu_contato":
        return "Não atendeu contato";
      case "motivos_pessoais":
        return "Motivos pessoais";
      default:
        return motivo;
    }
  };

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <GitBranch className="size-4 text-primary" />
          Histórico de Triagens
        </CardTitle>
        <Badge variant="secondary" className="text-xs font-normal">
          {triagens.length} {triagens.length === 1 ? "triagem" : "triagens"}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        {triagens.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Candidato ainda não foi vinculado a nenhum processo de triagem.
          </div>
        ) : (
          <div className="space-y-4">
            {triagens.map((triagem) => {
              const parecerEtapaAtual =
                triagem[PARECER_FIELD_BY_ETAPA[triagem.etapa]];

              return (
              <div
                key={triagem.id}
                className="p-4 rounded-lg bg-card border border-border/60 hover:border-border transition-colors shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Link
                        href={`/triagens/${triagem.id}`}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {triagem.vaga.cargo.titulo}
                      </Link>
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      Criada em {formatDate(triagem.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={triagem.resultado} />
                    <StatusBadge status={triagem.etapa} />
                    {triagem.avaliacaoIA?.scoreIa && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        <Sparkles className="size-3" />
                        <span>
                          Score IA:{" "}
                          {Math.round(parseFloat(triagem.avaliacaoIA.scoreIa))}/100
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {triagem.motivo && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Motivo:</span>{" "}
                    {formatMotivo(triagem.motivo)}
                  </p>
                )}

                {parecerEtapaAtual && (
                  <div className="text-xs text-muted-foreground/90 bg-muted/40 p-2.5 rounded-md border border-border/40">
                    <span className="font-medium text-foreground flex items-center gap-1 mb-1">
                      <MessageSquare className="size-3 text-muted-foreground/70" />
                      Parecer RH:
                    </span>
                    <p className="whitespace-pre-line leading-relaxed">
                      {parecerEtapaAtual}
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Link
                    href={`/triagens/${triagem.id}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "text-xs h-7 px-2.5 text-muted-foreground hover:text-foreground",
                    })}
                  >
                    <span>Ver detalhes da triagem</span>
                    <ArrowRight className="size-3 ml-1" />
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
