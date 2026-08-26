"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "~/components/ui/toast";
import {
  Briefcase,
  MapPin,
  Loader2,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import { updateTriagem } from "~/actions/triagens";
import { PageHeader } from "~/components/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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

interface TriagemEditorData {
  id: string;
  etapa: TriagemEtapa;
  resultado: TriagemResultado;
  motivo: TriagemMotivo | null;
  parecerRhCurriculo: string | null;
  parecerRhTestes: string | null;
  parecerRhEntrevistaRh: string | null;
  parecerRhEntrevistaGestor: string | null;
  parecerRhFinalizado: string | null;
  candidato: { nome: string };
  vaga: {
    cargo: { titulo: string; departamento: { nome: string } };
    cidade: string;
    uf: string;
  };
}

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

function buildInitialState(triagem: TriagemEditorData): PendingState {
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

const ETAPA_ORDER = ETAPAS.map((e) => e.value);

const RESULTADO_OPTIONS = (
  Object.keys(resultadoLabels) as TriagemResultado[]
).map((value) => ({ value, label: resultadoLabels[value] }));

export function TriagemDetailEditor({
  triagem,
}: {
  triagem: TriagemEditorData;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<PendingState>(() =>
    buildInitialState(triagem),
  );
  const [activeTab, setActiveTab] = React.useState<TriagemEtapa>(triagem.etapa);
  const [isPending, startTransition] = React.useTransition();
  const [motivoError, setMotivoError] = React.useState<string | null>(null);

  const requiresMotivo =
    pending.resultado === "reprovado" || pending.resultado === "desistente";
  const motivoOptions =
    pending.resultado === "reprovado"
      ? motivosReprovacao.map((v) => ({
          value: v,
          label: motivoReprovacaoLabels[v],
        }))
      : pending.resultado === "desistente"
        ? motivosDesistencia.map((v) => ({
            value: v,
            label: motivoDesistenciaLabels[v],
          }))
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

  const buildPayload = (state: PendingState) => {
    const needsMotivo =
      state.resultado === "reprovado" || state.resultado === "desistente";
    return {
      etapa: state.etapa,
      resultado: state.resultado,
      motivo: needsMotivo ? state.motivo : null,
      parecerRhCurriculo: state.parecerRhCurriculo || null,
      parecerRhTestes: state.parecerRhTestes || null,
      parecerRhEntrevistaRh: state.parecerRhEntrevistaRh || null,
      parecerRhEntrevistaGestor: state.parecerRhEntrevistaGestor || null,
      parecerRhFinalizado: state.parecerRhFinalizado || null,
    };
  };

  const handleFinalizar = () => {
    setMotivoError(null);
    startTransition(async () => {
      const result = await updateTriagem(triagem.id, buildPayload(pending));
      if (!result.success) {
        toast.add({
          type: "error",
          description: result.message ?? "Erro ao finalizar a triagem.",
        });
        const motivoIssue = result.errors?.motivo?.[0];
        if (motivoIssue) setMotivoError(motivoIssue);
        return;
      }
      toast.add({
        type: "success",
        description: "Triagem finalizada com sucesso.",
      });
      router.refresh();
    });
  };

  const handleAvancar = (etapaAtual: TriagemEtapa) => {
    const currentIndex = ETAPA_ORDER.indexOf(etapaAtual);
    const nextEtapa = ETAPA_ORDER[currentIndex + 1];
    if (!nextEtapa) return;

    startTransition(async () => {
      const newState = { ...pending, etapa: nextEtapa };
      const result = await updateTriagem(triagem.id, buildPayload(newState));
      if (!result.success) {
        toast.add({
          type: "error",
          description: result.message ?? "Erro ao avançar a etapa.",
        });
        return;
      }
      const nextLabel = ETAPAS.find((e) => e.value === nextEtapa)?.label;
      toast.add({
        type: "success",
        description: `Avançado para: ${nextLabel}`,
      });
      setPending(newState);
      setActiveTab(nextEtapa);
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader
        title={triagem.candidato.nome}
        description={
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
              <Briefcase className="h-4 w-4" />
              <span>
                {triagem.vaga.cargo.titulo} •{" "}
                {triagem.vaga.cargo.departamento.nome}
              </span>
              <span className="hidden sm:inline mx-1">•</span>
              <MapPin className="h-4 w-4 hidden sm:block" />
              <span>
                {triagem.vaga.cidade} - {triagem.vaga.uf}
              </span>
            </div>
          </div>
        }
      />

      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TriagemEtapa)}
          >
            <TabsList className=" w-full flex-wrap justify-between gap-2">
              {ETAPAS.map((etapa) => {
                const Icon = etapa.Icon;
                return (
                  <TabsTrigger
                    key={etapa.value}
                    value={etapa.value}
                    className="gap-2 flex-1"
                  >
                    <Icon className="size-4" />
                    {etapa.label}
                    {pending.etapa === etapa.value && (
                      <span className="ml-2 rounded-full bg-primary/15 px-2 text-xs  text-primary">
                        Atual
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {ETAPAS.map((etapa) => {
              const field = PARECER_FIELD_BY_ETAPA[etapa.value];
              const currentEtapaIndex = ETAPA_ORDER.indexOf(pending.etapa);
              const tabEtapaIndex = ETAPA_ORDER.indexOf(etapa.value);
              const isCurrentEtapa = tabEtapaIndex === currentEtapaIndex;
              const isPastEtapa = tabEtapaIndex < currentEtapaIndex;
              const isFinalEtapa = etapa.value === "finalizado";

              return (
                <TabsContent
                  key={etapa.value}
                  value={etapa.value}
                  className="mt-4 space-y-2"
                >
                  {tabEtapaIndex > currentEtapaIndex ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Esta etapa ainda não foi iniciada.
                    </p>
                  ) : (
                    <>
                      <Field>
                        <FieldLabel htmlFor={`parecer-${etapa.value}`}>
                          Parecer do RH — {etapa.label}
                        </FieldLabel>
                        <Textarea
                          id={`parecer-${etapa.value}`}
                          value={pending[field]}
                          onChange={(e) =>
                            setPending((p) => ({
                              ...p,
                              [field]: e.target.value,
                            }))
                          }
                          placeholder="Registre as impressões desta etapa..."
                          rows={5}
                          readOnly={isPastEtapa}
                          className={
                            isPastEtapa
                              ? "cursor-default bg-muted text-foreground"
                              : undefined
                          }
                        />
                        {isCurrentEtapa && (
                          <FieldDescription>
                            Observações do RH específicas desta etapa do
                            processo.
                          </FieldDescription>
                        )}
                      </Field>

                      {isCurrentEtapa &&
                        (isFinalEtapa ? (
                          <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                              <Field className="flex-1">
                                <FieldLabel>Resultado</FieldLabel>
                                <Select
                                  value={pending.resultado}
                                  onValueChange={(v) =>
                                    handleResultadoChange(v as TriagemResultado)
                                  }
                                  disabled={isPending}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o resultado..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {RESULTADO_OPTIONS.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Field>

                              {requiresMotivo && (
                                <Field className="flex-1">
                                  <FieldLabel>Motivo</FieldLabel>
                                  <Select
                                    value={pending.motivo ?? ""}
                                    onValueChange={(v) => {
                                      setPending((p) => ({
                                        ...p,
                                        motivo: v as TriagemMotivo,
                                      }));
                                      setMotivoError(null);
                                    }}
                                    disabled={isPending}
                                  >
                                    <SelectTrigger
                                      aria-invalid={Boolean(motivoError)}
                                    >
                                      <SelectValue placeholder="Selecione o motivo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {motivoOptions.map((opt) => (
                                        <SelectItem
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {motivoError && (
                                    <span className="text-xs text-destructive">
                                      {motivoError}
                                    </span>
                                  )}
                                </Field>
                              )}
                            </div>

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                onClick={handleFinalizar}
                                disabled={
                                  isPending ||
                                  !pending[field].trim() ||
                                  pending.resultado === "em_andamento" ||
                                  (requiresMotivo && !pending.motivo)
                                }
                              >
                                {isPending ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="size-4" />
                                )}
                                Finalizar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={() => handleAvancar(etapa.value)}
                              disabled={isPending || !pending[field].trim()}
                            >
                              {isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                              Avançar
                            </Button>
                          </div>
                        ))}
                    </>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
