import * as React from "react";
import { Briefcase, Building2, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import type { CandidatoExperiencia } from "~/server/db/schema";

interface CandidateExperienceProps {
  experiencias: CandidatoExperiencia[];
}

export function CandidateExperience({
  experiencias,
}: CandidateExperienceProps) {
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
          <Briefcase className="size-4 text-primary" />
          Experiência Profissional
        </CardTitle>
        <Badge variant="secondary" className="text-xs font-normal">
          {experiencias.length}{" "}
          {experiencias.length === 1 ? "registro" : "registros"}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        {experiencias.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Nenhuma experiência profissional cadastrada.
          </div>
        ) : (
          <div className="space-y-4">
            {experiencias.map((exp, index) => {
              const startFormatted = formatDateYearMonth(exp.dataEntrada);
              const endFormatted = exp.dataSaida
                ? formatDateYearMonth(exp.dataSaida)
                : "Atual";

              return (
                <div
                  key={exp.id ?? index}
                  className="p-4 rounded-lg bg-muted/30 border border-border/40 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h4 className="font-semibold text-foreground text-sm">
                      {exp.cargoTitulo}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="size-3 text-muted-foreground/70" />
                      {startFormatted} – {endFormatted}
                    </span>
                  </div>

                  {exp.empresa && (
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-muted-foreground/70" />
                      {exp.empresa}
                    </p>
                  )}

                  {exp.descricao && (
                    <p className="text-sm text-muted-foreground/90 whitespace-pre-line pt-1 leading-relaxed">
                      {exp.descricao}
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
