import * as React from "react";
import { Award, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import type { CandidatoCertificacao } from "~/server/db/schema";

interface CandidateCertificationsProps {
  certificacoes: CandidatoCertificacao[];
}

export function CandidateCertifications({
  certificacoes,
}: CandidateCertificationsProps) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const [year, month, day] = dateStr.split("-");
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <Award className="size-4 text-primary" />
          Certificações
        </CardTitle>
        <Badge variant="secondary" className="text-xs font-normal">
          {certificacoes.length}{" "}
          {certificacoes.length === 1 ? "registro" : "registros"}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        {certificacoes.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Nenhuma certificação cadastrada.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {certificacoes.map((cert, index) => {
              const obtidaEmFormatted = formatDate(cert.obtidaEm);
              const validadeFormatted = formatDate(cert.validade);

              return (
                <div
                  key={cert.id ?? index}
                  className="p-3.5 rounded-lg bg-muted/30 border border-border/40 space-y-1.5"
                >
                  <h4 className="font-semibold text-foreground text-sm">
                    {cert.titulo}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {obtidaEmFormatted && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-muted-foreground/70" />
                        Obtida em: {obtidaEmFormatted}
                      </span>
                    )}

                    {validadeFormatted ? (
                      <span className="flex items-center gap-1">
                        Validade: {validadeFormatted}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/80">
                        Sem data de expiração
                      </span>
                    )}
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
