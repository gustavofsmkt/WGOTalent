import * as React from "react";
import {
  Sliders,
  Briefcase,
  Building2,
  Clock,
  Plane,
  Truck,
  Zap,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import type { CandidatoDetailCompleto } from "~/server/db/repositories/candidato";

interface CandidatePreferencesProps {
  candidato: CandidatoDetailCompleto;
}

export function CandidatePreferences({ candidato }: CandidatePreferencesProps) {
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-2 border-b border-border/40">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <Sliders className="size-4 text-primary" />
          Preferências e Interesses
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Briefcase className="size-3.5 text-muted-foreground/70" />
              Cargo de Interesse
            </p>
            <p className="font-medium text-foreground ">
              {candidato.cargoInteresse?.titulo ?? "Não especificado"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Building2 className="size-3.5 text-muted-foreground/70" />
              Área de Interesse
            </p>
            <p className="font-medium text-foreground ">
              {candidato.areaInteresse?.nome ?? "Não especificada"}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="size-3.5 text-muted-foreground/70" />
              Disponibilidade de Horários
            </p>
            <p className="font-medium text-foreground ">
              {candidato.disponibilidadeHorarios ?? "Não especificada"}
            </p>
          </div>
        </div>

        {/* Availability Badges / Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border ${
              candidato.inicioImediato
                ? "bg-success/10 text-success border-success/30"
                : "bg-muted text-muted-foreground border-border/60"
            }`}
          >
            <Zap className="size-3.5" />
            <span>
              {candidato.inicioImediato
                ? "Início Imediato"
                : "Início Imediato: Não"}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border ${
              candidato.disponivelViagens
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted text-muted-foreground border-border/60"
            }`}
          >
            <Plane className="size-3.5" />
            <span>
              {candidato.disponivelViagens
                ? "Disponível para Viagens"
                : "Viagens: Não"}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border ${
              candidato.disponivelMudanca
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted text-muted-foreground border-border/60"
            }`}
          >
            <Truck className="size-3.5" />
            <span>
              {candidato.disponivelMudanca
                ? "Disponível para Mudança"
                : "Mudança: Não"}
            </span>
          </div>
        </div>

        {candidato.resumoProfissional && (
          <div className="pt-2 border-t border-border/40 space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="size-3.5 text-muted-foreground/70" />
              Resumo Profissional
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/30 p-2 rounded-lg border border-border/40">
              {candidato.resumoProfissional}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
