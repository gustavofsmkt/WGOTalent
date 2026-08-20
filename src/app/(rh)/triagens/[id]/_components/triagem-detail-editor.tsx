"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Briefcase,
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  BrainCircuit,
  PlusCircle,
  AlertTriangle,
  MinusCircle,
  Save,
  Loader2,
} from "lucide-react";

import { updateTriagem } from "~/actions/triagens";
import type { TriagemCompleta } from "~/server/db/schema";
import { PageHeader } from "~/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button, buttonVariants } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Field, FieldLabel, FieldDescription } from "~/components/ui/field";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { EditableStatusBadge } from "~/components/editable-status-badge";
import { getWhatsAppUrl } from "~/lib/whatsapp";
import {
  ETAPAS,
  resultadoLabels,
  motivoReprovacaoLabels,
  motivoDesistenciaLabels,
  PARECER_FIELD_BY_ETAPA,
} from "~/lib/triagem-format";
import {
  motivosReprovacao,
  motivosDesistencia,
  type TriagemEtapa,
  type TriagemResultado,
  type TriagemMotivo,
} from "~/lib/validation/triagem";

interface PendingState {
  etapa: TriagemEtapa;
  resultado: TriagemResultado;
  motivo: TriagemMotivo | null;
  parecerRhCurriculo: string;
  parecerRhTestes: string;
  parecerRhEntrevistaRh: string;
  parecerRhEntrevistaGestor: string;
  parecerRhFinalizado: string;
}

function buildInitialState(triagem: TriagemCompleta): PendingState {
  return {
    etapa: triagem.etapa,
    resultado: triagem.resultado,
    motivo: triagem.motivo,
    parecerRhCurriculo: triagem.parecerRhCurriculo ?? "",
    parecerRhTestes: triagem.parecerRhTestes ?? "",
    parecerRhEntrevistaRh: triagem.parecerRhEntrevistaRh ?? "",
    parecerRhEntrevistaGestor: triagem.parecerRhEntrevistaGestor ?? "",
    parecerRhFinalizado: triagem.parecerRhFinalizado ?? "",
  };
}

const ETAPA_OPTIONS = ETAPAS.map((e) => ({ value: e.value, label: e.label }));
const RESULTADO_OPTIONS = (Object.keys(resultadoLabels) as TriagemResultado[]).map(
  (value) => ({ value, label: resultadoLabels[value] }),
);

export function TriagemDetailEditor({ triagem }: { triagem: TriagemCompleta }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<PendingState>(() =>
    buildInitialState(triagem),
  );
  const [baseline, setBaseline] = React.useState<PendingState>(() =>
    buildInitialState(triagem),
  );
  const [activeTab, setActiveTab] = React.useState<TriagemEtapa>(triagem.etapa);
  const [isPending, startTransition] = React.useTransition();
  const [motivoError, setMotivoError] = React.useState<string | null>(null);

  const isDirty = JSON.stringify(pending) !== JSON.stringify(baseline);

  const requiresMotivo =
    pending.resultado === "reprovado" || pending.resultado === "desistente";
  const motivoOptions =
    pending.resultado === "reprovado"
      ? motivosReprovacao.map((v) => ({ value: v, label: motivoReprovacaoLabels[v] }))
      : pending.resultado === "desistente"
        ? motivosDesistencia.map((v) => ({ value: v, label: motivoDesistenciaLabels[v] }))
        : [];

  const handleResultadoChange = (novoResultado: TriagemResultado) => {
    setPending((p) => ({
      ...p,
      resultado: novoResultado,
      motivo:
        novoResultado === "reprovado" || novoResultado === "desistente"
          ? p.motivo
          : null,
    }));
    setMotivoError(null);
  };

  const handleSave = () => {
    setMotivoError(null);

    const payload = {
      etapa: pending.etapa,
      resultado: pending.resultado,
      motivo: requiresMotivo ? pending.motivo : null,
      parecerRhCurriculo: pending.parecerRhCurriculo || null,
      parecerRhTestes: pending.parecerRhTestes || null,
      parecerRhEntrevistaRh: pending.parecerRhEntrevistaRh || null,
      parecerRhEntrevistaGestor: pending.parecerRhEntrevistaGestor || null,
      parecerRhFinalizado: pending.parecerRhFinalizado || null,
    };

    startTransition(async () => {
      const result = await updateTriagem(triagem.id, payload);

      if (!result.success) {
        toast.error(result.message ?? "Erro ao salvar a triagem.");
        const motivoIssue = result.errors?.motivo?.[0];
        if (motivoIssue) {
          setMotivoError(motivoIssue);
        }
        return;
      }

      toast.success("Triagem atualizada com sucesso.");
      setBaseline(pending);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 mx-auto max-w-7xl">
      <PageHeader
        title={triagem.candidato.nome}
        description={
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
              <Briefcase className="h-4 w-4" />
              <span>
                {triagem.vaga.cargo.titulo} • {triagem.vaga.cargo.departamento.nome}
              </span>
              <span className="hidden sm:inline mx-1">•</span>
              <MapPin className="h-4 w-4 hidden sm:block" />
              <span>
                {triagem.vaga.cidade} - {triagem.vaga.uf}
              </span>
            </div>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <EditableStatusBadge
              value={pending.etapa}
              options={ETAPA_OPTIONS}
              onChange={(v) => setPending((p) => ({ ...p, etapa: v }))}
              aria-label="Etapa atual do processo"
            />
            <EditableStatusBadge
              value={pending.resultado}
              options={RESULTADO_OPTIONS}
              onChange={handleResultadoChange}
              aria-label="Resultado"
            />

            {requiresMotivo && (
              <div className="flex flex-col gap-1">
                <Select
                  value={pending.motivo ?? ""}
                  onValueChange={(v) => {
                    if (typeof v === "string") {
                      setPending((p) => ({ ...p, motivo: v as TriagemMotivo }));
                      setMotivoError(null);
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="h-7 text-xs" aria-invalid={Boolean(motivoError)}>
                    <SelectValue placeholder="Motivo...">
                      {(val: string | null) =>
                        motivoOptions.find((opt) => opt.value === val)?.label ?? "Motivo..."
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end" className="min-w-[260px]">
                    {motivoOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        <span className="whitespace-normal break-words">{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {motivoError && (
                  <span className="text-xs text-destructive">{motivoError}</span>
                )}
              </div>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              Salvar
            </Button>
          </div>
        }
      />

      {/* Etapas do processo, como abas de navegação */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TriagemEtapa)}
          >
            <TabsList className="h-auto w-full flex-wrap justify-start">
              {ETAPAS.map((etapa) => {
                const Icon = etapa.Icon;
                return (
                  <TabsTrigger key={etapa.value} value={etapa.value} className="gap-1.5">
                    <Icon className="size-4" />
                    {etapa.label}
                    {pending.etapa === etapa.value && (
                      <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        Atual
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {ETAPAS.map((etapa) => {
              const field = PARECER_FIELD_BY_ETAPA[etapa.value];
              return (
                <TabsContent key={etapa.value} value={etapa.value} className="mt-4">
                  <Field>
                    <FieldLabel htmlFor={`parecer-${etapa.value}`}>
                      Parecer do RH — {etapa.label}
                    </FieldLabel>
                    <Textarea
                      id={`parecer-${etapa.value}`}
                      value={pending[field]}
                      onChange={(e) =>
                        setPending((p) => ({ ...p, [field]: e.target.value }))
                      }
                      placeholder="Registre as impressões desta etapa..."
                      rows={5}
                    />
                    <FieldDescription>
                      Observações do RH específicas desta etapa do processo.
                    </FieldDescription>
                  </Field>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Candidato Info Rápida */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contato Rápido</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {triagem.candidato.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {triagem.candidato.celular}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`mailto:${triagem.candidato.email}`}
                  className={buttonVariants({ variant: "secondary", className: "flex-1" })}
                >
                  <Mail className="mr-2 h-4 w-4" /> Email
                </a>
                <a
                  href={getWhatsAppUrl(triagem.candidato.celular)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "secondary", className: "flex-1" })}
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </div>
              <Link
                href={`/candidatos/${triagem.candidato.id}`}
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                Ver Perfil Completo
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          {/* Avaliação de IA */}
          <Card className="h-full relative overflow-hidden">
            <div className="absolute right-0 top-0 p-6 opacity-[0.03] pointer-events-none">
              <BrainCircuit className="h-32 w-32" />
            </div>
            <CardHeader className="relative z-10 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg text-primary">
                  <BrainCircuit className="h-5 w-5" />
                  Avaliação de IA WGO
                </CardTitle>
                {triagem.avaliacao_ia?.vagaFoiInferida && (
                  <span className="mt-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Vaga inferida automaticamente
                  </span>
                )}
              </div>
              {triagem.avaliacao_ia && (
                <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-3">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-primary">
                      {Number(triagem.avaliacao_ia.scoreIa).toFixed(0)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Score Global
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="relative z-10">
              {triagem.avaliacao_ia ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold flex items-center gap-2 text-foreground">
                      Parecer Analítico
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {triagem.avaliacao_ia.parecerIa}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border-l-4 border-emerald-500 bg-muted/30 p-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                        <PlusCircle className="h-4 w-4 text-emerald-500" />
                        Pontos Fortes
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {triagem.avaliacao_ia.pontosFortes}
                      </p>
                    </div>

                    <div className="rounded-lg border-l-4 border-amber-500 bg-muted/30 p-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Alertas
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {triagem.avaliacao_ia.alertas}
                      </p>
                    </div>

                    <div className="rounded-lg border-l-4 border-slate-400 bg-muted/30 p-4 md:col-span-2">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                        <MinusCircle className="h-4 w-4 text-slate-400" />
                        Requisitos Faltantes
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {triagem.avaliacao_ia.requisitosFaltantes}
                      </p>
                    </div>

                    {triagem.avaliacao_ia.eliminatoriosFalhos &&
                      triagem.avaliacao_ia.eliminatoriosFalhos.trim() !== "" && (
                        <div className="rounded-lg border-l-4 border-destructive bg-destructive/5 p-4 md:col-span-2">
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            Eliminatórios Falhos
                          </h4>
                          <p className="text-sm text-destructive whitespace-pre-wrap">
                            {triagem.avaliacao_ia.eliminatoriosFalhos}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <BrainCircuit className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Nenhuma avaliação de IA disponível para esta triagem.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
