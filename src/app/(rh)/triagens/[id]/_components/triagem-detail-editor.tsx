"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, MapPin, Save, Loader2 } from "lucide-react";

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
import { EditableStatusBadge } from "~/components/editable-status-badge";
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

const ETAPA_OPTIONS = ETAPAS.map((e) => ({ value: e.value, label: e.label }));
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
  const [baseline, setBaseline] = React.useState<PendingState>(() =>
    buildInitialState(triagem),
  );
  const [activeTab, setActiveTab] = React.useState<TriagemEtapa>(triagem.etapa);
  const [isPending, startTransition] = React.useTransition();
  const [motivoError, setMotivoError] = React.useState<string | null>(null);

  const isDirty =
    pending.etapa !== baseline.etapa ||
    pending.resultado !== baseline.resultado ||
    pending.motivo !== baseline.motivo ||
    pending.parecerRhCurriculo !== baseline.parecerRhCurriculo ||
    pending.parecerRhTestes !== baseline.parecerRhTestes ||
    pending.parecerRhEntrevistaRh !== baseline.parecerRhEntrevistaRh ||
    pending.parecerRhEntrevistaGestor !== baseline.parecerRhEntrevistaGestor ||
    pending.parecerRhFinalizado !== baseline.parecerRhFinalizado;

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
              <div className="flex flex-col gap-2">
                <Select
                  value={pending.motivo ?? ""}
                  onValueChange={(v) => {
                    if (typeof v === "string") {
                      setPending((p) => ({ ...p, motivo: v as TriagemMotivo }));
                      setMotivoError(null);
                    }
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-7 text-xs"
                    aria-invalid={Boolean(motivoError)}
                  >
                    <SelectValue placeholder="Motivo...">
                      {(val: string | null) =>
                        motivoOptions.find((opt) => opt.value === val)?.label ??
                        "Motivo..."
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end" className="min-w-[260px]">
                    {motivoOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-xs"
                      >
                        <span className="whitespace-normal break-words">
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {motivoError && (
                  <span className="text-xs text-destructive">
                    {motivoError}
                  </span>
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
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Salvar
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TriagemEtapa)}
          >
            <TabsList className="h-auto w-full flex-wrap justify-start">
              {ETAPAS.map((etapa) => {
                const Icon = etapa.Icon;
                return (
                  <TabsTrigger
                    key={etapa.value}
                    value={etapa.value}
                    className="gap-2"
                  >
                    <Icon className="size-4" />
                    {etapa.label}
                    {pending.etapa === etapa.value && (
                      <span className="ml-4 rounded-full bg-primary/15 px-2  text-[10px] font-semibold text-primary">
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
                <TabsContent
                  key={etapa.value}
                  value={etapa.value}
                  className="mt-4"
                >
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
    </>
  );
}
