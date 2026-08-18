import * as React from "react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

export type StatusTone = "success" | "warning" | "destructive" | "info" | "neutral";

export type DomainStatus =
  // Vaga status
  | "aberta"
  | "concluida"
  | "cancelada"
  | "pausada"
  | "incompleta"
  // Triagem resultado
  | "em_andamento"
  | "aprovado"
  | "reprovado"
  | "desistente"
  | "banco_talentos"
  // Triagem etapa
  | "curriculo"
  | "testes"
  | "entrevista_rh"
  | "entrevista_gestor"
  | "finalizado"
  // Generic / Cargo
  | "ativo"
  | "inativo";

interface StatusConfig {
  label: string;
  tone: StatusTone;
}

const statusConfigMap: Record<DomainStatus, StatusConfig> = {
  // Vagas
  aberta: { label: "Aberta", tone: "success" },
  concluida: { label: "Concluída", tone: "neutral" },
  pausada: { label: "Pausada", tone: "warning" },
  cancelada: { label: "Cancelada", tone: "destructive" },
  incompleta: { label: "Incompleta", tone: "neutral" },

  // Triagem Resultado
  em_andamento: { label: "Em andamento", tone: "info" },
  aprovado: { label: "Aprovado", tone: "success" },
  reprovado: { label: "Reprovado", tone: "destructive" },
  desistente: { label: "Desistente", tone: "neutral" },
  banco_talentos: { label: "Banco de Talentos", tone: "warning" },

  // Triagem Etapa
  curriculo: { label: "Currículo", tone: "info" },
  testes: { label: "Testes", tone: "info" },
  entrevista_rh: { label: "Entrevista RH", tone: "info" },
  entrevista_gestor: { label: "Entrevista Gestor", tone: "info" },
  finalizado: { label: "Finalizado", tone: "neutral" },

  // Cargo / Ativo
  ativo: { label: "Ativo", tone: "success" },
  inativo: { label: "Inativo", tone: "neutral" },
};

const toneStyles: Record<StatusTone, string> = {
  success:
    "bg-success/15 text-success border-success/30 dark:bg-success/20 dark:text-success",
  warning:
    "bg-warning/15 text-warning-foreground border-warning/30 dark:bg-warning/20 dark:text-warning",
  info: "bg-info/15 text-info border-info/30 dark:bg-info/20 dark:text-info",
  destructive:
    "bg-destructive/15 text-destructive border-destructive/30 dark:bg-destructive/20 dark:text-destructive",
  neutral: "bg-muted text-muted-foreground border-border",
};

export interface StatusBadgeProps
  extends Omit<React.ComponentProps<typeof Badge>, "variant"> {
  status?: DomainStatus | string;
  tone?: StatusTone;
  label?: React.ReactNode;
}

export function StatusBadge({
  status,
  tone,
  label,
  children,
  className,
  ...props
}: StatusBadgeProps) {
  const isKnown = status && status in statusConfigMap;
  const config = isKnown ? statusConfigMap[status as DomainStatus] : null;

  const resolvedTone = tone ?? config?.tone ?? "neutral";
  const resolvedLabel = label ?? children ?? config?.label ?? status;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border tracking-wide",
        toneStyles[resolvedTone],
        className
      )}
      {...props}
    >
      {resolvedLabel}
    </Badge>
  );
}
