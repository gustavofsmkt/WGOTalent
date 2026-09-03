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
  XCircle,
  Save,
  type LucideIcon,
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
  RESULTADOS_ENCERRAMENTO,
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
    cidades: { id: string; nome: string; uf: string }[];
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

const RESULTADO_ENCERRAMENTO_OPTIONS = RESULTADOS_ENCERRAMENTO.map((value) => ({
  value,
  label: resultadoLabels[value],
}));

/**
 * Bloco Resultado + Motivo + botão de confirmação. Compartilhado pela aba
 * "Finalizado" (resultado completo, botão "Finalizar") e pelo encerramento
 * antecipado nas etapas anteriores (só reprovado/desistente/banco, botão
 * "Encerrar processo") — mantém um único lugar definindo esse layout.
 */
function ResultadoMotivoForm({
  pending,
  setPending,
  motivoError,
  setMotivoError,
  isPending,
  resultadoOptions,
  confirmLabel,
  confirmIcon,
  confirmVariant = "default",
  parecerPreenchido,
  onConfirm,
}: {
  pending: PendingState;
  setPending: React.Dispatch<React.SetStateAction<PendingState>>;
  motivoError: string | null;
  setMotivoError: (value: string | null) => void;
  isPending: boolean;
  resultadoOptions: { value: TriagemResultado; label: string }[];
  confirmLabel: string;
  confirmIcon: LucideIcon;
  confirmVariant?: "default" | "destructive";
  parecerPreenchido: boolean;
  onConfirm: () => void;
}) {
  const ConfirmIcon = confirmIcon;

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Field className="flex-1">
          <FieldLabel>Resultado</FieldLabel>
          <Select
            value={pending.resultado}
            onValueChange={(v) => handleResultadoChange(v as TriagemResultado)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o resultado...">
                {(val: string | null) =>
                  resultadoOptions.find((o) => o.value === val)?.label ??
                  "Selecione o resultado..."
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {resultadoOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
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
                setPending((p) => ({ ...p, motivo: v as TriagemMotivo }));
                setMotivoError(null);
              }}
              disabled={isPending}
            >
              <SelectTrigger aria-invalid={Boolean(motivoError)}>
                <SelectValue placeholder="Selecione o motivo...">
                  {(val: string | null) =>
                    motivoOptions.find((o) => o.value === val)?.label ??
                    "Selecione o motivo..."
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {motivoOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {motivoError && (
              <span className="text-xs text-destructive">{motivoError}</span>
            )}
          </Field>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={
            isPending ||
            !parecerPreenchido ||
            pending.resultado === "em_andamento" ||
            (requiresMotivo && !pending.motivo)
          }
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ConfirmIcon className="size-4" />
          )}
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

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
  const [encerrando, setEncerrando] = React.useState(false);
  const [isSavingManual, setIsSavingManual] = React.useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autoSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const autoSaveClearRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pendingRef = React.useRef(pending);

  // Descarta o resultado/motivo escolhidos no encerramento antecipado sem
  // confirmar — o "Avançar" opera sobre o mesmo `pending`.
  const resetEncerramento = React.useCallback(() => {
    setEncerrando(false);
    setMotivoError(null);
    setPending((p) => ({
      ...p,
      resultado: triagem.resultado,
      motivo: triagem.motivo,
    }));
  }, [triagem.resultado, triagem.motivo]);

  React.useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const saveParecerSilent = async () => {
    setAutoSaveStatus("saving");
    const result = await updateTriagem(
      triagem.id,
      buildPayload(pendingRef.current),
    );
    if (result.success) {
      setAutoSaveStatus("saved");
      if (autoSaveClearRef.current) clearTimeout(autoSaveClearRef.current);
      autoSaveClearRef.current = setTimeout(
        () => setAutoSaveStatus("idle"),
        3000,
      );
    } else {
      setAutoSaveStatus("error");
    }
  };

  const scheduleSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => void saveParecerSilent(), 1000);
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

  const handleEncerrar = () => {
    setMotivoError(null);
    startTransition(async () => {
      const newState = {
        ...pending,
        etapa: "finalizado" as TriagemEtapa,
      };
      const result = await updateTriagem(triagem.id, buildPayload(newState));
      if (!result.success) {
        toast.add({
          type: "error",
          description: result.message ?? "Erro ao encerrar o processo.",
        });
        const motivoIssue = result.errors?.motivo?.[0];
        if (motivoIssue) setMotivoError(motivoIssue);
        return;
      }
      toast.add({
        type: "success",
        description: `Processo encerrado — ${resultadoLabels[pending.resultado]}.`,
      });
      setPending(newState);
      setActiveTab("finalizado");
      setEncerrando(false);
      router.refresh();
    });
  };

  const handleSalvarParecer = async () => {
    if (isSavingManual) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (autoSaveClearRef.current) clearTimeout(autoSaveClearRef.current);
    setIsSavingManual(true);
    const result = await updateTriagem(triagem.id, buildPayload(pending));
    setIsSavingManual(false);
    if (!result.success) {
      toast.add({
        type: "error",
        description: result.message ?? "Erro ao salvar o parecer.",
      });
      return;
    }
    setAutoSaveStatus("idle");
    toast.add({ type: "success", description: "Parecer salvo." });
  };

  const handleBlurSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    void saveParecerSilent();
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
                {triagem.vaga.cidades
                  .map((c) => `${c.nome} - ${c.uf}`)
                  .join(", ")}
              </span>
            </div>
          </div>
        }
      />

      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as TriagemEtapa);
              resetEncerramento();
            }}
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
                          onChange={(e) => {
                            setPending((p) => ({
                              ...p,
                              [field]: e.target.value,
                            }));
                            if (isCurrentEtapa) scheduleSave();
                          }}
                          onBlur={isCurrentEtapa ? handleBlurSave : undefined}
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
                          <div className="flex items-center justify-between gap-2">
                            <FieldDescription>
                              Observações do RH específicas desta etapa do
                              processo.
                            </FieldDescription>
                            {autoSaveStatus === "saving" && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="size-3 animate-spin" />
                                Salvando...
                              </span>
                            )}
                            {autoSaveStatus === "saved" && (
                              <span className="text-xs text-muted-foreground">
                                Salvo automaticamente
                              </span>
                            )}
                            {autoSaveStatus === "error" && (
                              <span className="text-xs text-destructive">
                                Erro ao salvar
                              </span>
                            )}
                          </div>
                        )}
                      </Field>

                      {isCurrentEtapa &&
                        (isFinalEtapa ? (
                          <div className="space-y-4">
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSalvarParecer}
                                disabled={isPending || isSavingManual}
                              >
                                {isSavingManual ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Save className="size-4" />
                                )}
                                Salvar Parecer
                              </Button>
                            </div>
                            <ResultadoMotivoForm
                              pending={pending}
                              setPending={setPending}
                              motivoError={motivoError}
                              setMotivoError={setMotivoError}
                              isPending={isPending}
                              resultadoOptions={RESULTADO_OPTIONS}
                              confirmLabel="Finalizar"
                              confirmIcon={CheckCircle2}
                              parecerPreenchido={Boolean(pending[field].trim())}
                              onConfirm={handleFinalizar}
                            />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                                aria-expanded={encerrando}
                                onClick={() =>
                                  encerrando
                                    ? resetEncerramento()
                                    : setEncerrando(true)
                                }
                                disabled={isPending || isSavingManual}
                              >
                                <XCircle className="size-4" />
                                Encerrar processo
                              </Button>

                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleSalvarParecer}
                                  disabled={
                                    isPending || isSavingManual || encerrando
                                  }
                                >
                                  {isSavingManual ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Save className="size-4" />
                                  )}
                                  Salvar
                                </Button>

                                <Button
                                  type="button"
                                  onClick={() => handleAvancar(etapa.value)}
                                  disabled={
                                    isPending ||
                                    isSavingManual ||
                                    !pending[field].trim() ||
                                    encerrando
                                  }
                                >
                                  {isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <ChevronRight className="size-4" />
                                  )}
                                  Avançar
                                </Button>
                              </div>
                            </div>

                            {encerrando && (
                              <ResultadoMotivoForm
                                pending={pending}
                                setPending={setPending}
                                motivoError={motivoError}
                                setMotivoError={setMotivoError}
                                isPending={isPending}
                                resultadoOptions={RESULTADO_ENCERRAMENTO_OPTIONS}
                                confirmLabel="Encerrar processo"
                                confirmIcon={XCircle}
                                confirmVariant="destructive"
                                parecerPreenchido={Boolean(
                                  pending[field].trim(),
                                )}
                                onConfirm={handleEncerrar}
                              />
                            )}
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
