import * as React from "react";
import { GraduationCap, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import type { CandidatoFormacao } from "~/server/db/schema";

interface CandidateEducationProps {
  formacoes: CandidatoFormacao[];
}

export function CandidateEducation({ formacoes }: CandidateEducationProps) {
  const formatDateYearMonth = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      const [year, month] = dateStr.split("-");
      if (year && month) {
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        return new Intl.DateTimeFormat("pt-BR", {
          month: "short",
          year: "numeric",
        }).format(date);
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <GraduationCap className="size-4 text-primary" />
          Formação Acadêmica
        </CardTitle>
        <Badge variant="secondary" className="text-xs font-normal">
          {formacoes.length} {formacoes.length === 1 ? "registro" : "registros"}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        {formacoes.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Nenhuma formação acadêmica cadastrada.
          </div>
        ) : (
          <div className="space-y-4">
            {formacoes.map((formacao, index) => {
              const startFormatted = formatDateYearMonth(formacao.dataInicio);
              const endFormatted = formacao.dataTermino
                ? formatDateYearMonth(formacao.dataTermino)
                : "Em andamento";

              return (
                <div
                  key={formacao.id ?? index}
                  className="p-4 rounded-lg bg-muted/30 border border-border/40 space-y-1.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h4 className="font-semibold text-foreground text-sm">
                      {formacao.titulo}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="size-3 text-muted-foreground/70" />
                      {startFormatted} – {endFormatted}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-primary">
                    {formacao.areaFormacao}
                  </p>

                  {formacao.instituicao && (
                    <p className="text-xs text-muted-foreground">
                      {formacao.instituicao}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
