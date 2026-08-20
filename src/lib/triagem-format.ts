import {
  FileText,
  Code,
  Users,
  UserCheck,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import {
  motivosReprovacao,
  motivosDesistencia,
  type TriagemEtapa,
  type TriagemResultado,
} from "~/lib/validation/triagem";

export interface EtapaDef {
  value: TriagemEtapa;
  label: string;
  Icon: LucideIcon;
  dotColor: string;
}

export const ETAPAS: readonly EtapaDef[] = [
  { value: "curriculo", label: "Currículo", Icon: FileText, dotColor: "bg-blue-500" },
  { value: "testes", label: "Testes", Icon: Code, dotColor: "bg-amber-500" },
  { value: "entrevista_rh", label: "Entrevista RH", Icon: Users, dotColor: "bg-purple-500" },
  { value: "entrevista_gestor", label: "Entrevista Gestor", Icon: UserCheck, dotColor: "bg-indigo-500" },
  { value: "finalizado", label: "Finalizado", Icon: CheckCircle, dotColor: "bg-emerald-500" },
] as const;

export const etapaLabels: Record<TriagemEtapa, string> = {
  curriculo: "Triagem de Currículo",
  testes: "Testes / Avaliação",
  entrevista_rh: "Entrevista RH",
  entrevista_gestor: "Entrevista com Gestor",
  finalizado: "Finalizado",
};

export const resultadoLabels: Record<TriagemResultado, string> = {
  em_andamento: "Em Andamento",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  desistente: "Desistente",
  banco_talentos: "Banco de Talentos",
};

export const motivoReprovacaoLabels: Record<(typeof motivosReprovacao)[number], string> = {
  curriculo: "Currículo / Perfil não aderente",
  fit_cultural: "Fit cultural insuficiente",
  testes: "Reprovado nos testes técnicos",
  rh: "Avaliação do RH desfavorável",
  gestor: "Avaliação do Gestor desfavorável",
};

export const motivoDesistenciaLabels: Record<(typeof motivosDesistencia)[number], string> = {
  incompatibilidade_salarial: "Incompatibilidade salarial",
  aceitou_outra_proposta: "Aceitou outra proposta",
  nao_atendeu_contato: "Não atendeu contato / Incomunicável",
  motivos_pessoais: "Motivos pessoais",
};

export const MOTIVO_LABELS: Record<string, string> = {
  curriculo: "Currículo / Perfil",
  fit_cultural: "Fit Cultural",
  testes: "Testes Técnicos",
  rh: "Avaliação RH",
  gestor: "Avaliação Gestor",
  incompatibilidade_salarial: "Incompatibilidade Salarial",
  aceitou_outra_proposta: "Outra Proposta",
  nao_atendeu_contato: "Não Atendeu Contato",
  motivos_pessoais: "Motivos Pessoais",
};

export const PARECER_FIELD_BY_ETAPA = {
  curriculo: "parecerRhCurriculo",
  testes: "parecerRhTestes",
  entrevista_rh: "parecerRhEntrevistaRh",
  entrevista_gestor: "parecerRhEntrevistaGestor",
  finalizado: "parecerRhFinalizado",
} as const satisfies Record<TriagemEtapa, string>;

export type ParecerField = (typeof PARECER_FIELD_BY_ETAPA)[TriagemEtapa];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.substring(0, 2) ?? "").toUpperCase();
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts[parts.length - 1]?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}

export function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "";
  }
}
