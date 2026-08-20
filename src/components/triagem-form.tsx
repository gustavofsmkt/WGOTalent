"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import type { z } from "zod";
import {
  triagemSchema,
  triagemBaseSchema,
  updateTriagemSchema,
  motivosReprovacao,
  motivosDesistencia,
  type TriagemEtapa,
  type TriagemResultado,
  type TriagemMotivo,
} from "~/lib/validation/triagem";
import { createTriagem, updateTriagem } from "~/actions/triagens";
import type { Triagem } from "~/server/db/schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "~/components/ui/field";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { FormSubmitButton } from "~/components/form-submit-button";
import { ErrorCallout } from "~/components/error-callout";
import { cn } from "~/lib/utils";

export interface CandidatoOption {
  id: string;
  nome: string;
  email: string;
}

export interface VagaOption {
  id: string;
  status: string;
  cidade: string;
  uf: string;
  cargo: {
    titulo: string;
    departamento: {
      nome: string;
    };
  };
}

export interface TriagemFormProps {
  triagem?: {
    id: string;
    candidatoId: string;
    vagaId: string;
    etapa: TriagemEtapa;
    resultado: TriagemResultado;
    motivo?: TriagemMotivo | null;
    parecerRh?: string | null;
    candidato?: {
      id: string;
      nome: string;
      email: string;
    } | null;
    vaga?: {
      id: string;
      cargoTitulo?: string;
      departamentoNome?: string;
      cidade?: string;
      uf?: string;
      cargo?: {
        titulo: string;
        departamento?: {
          nome: string;
        };
      };
    } | null;
  } | null;
  candidatoOptions?: CandidatoOption[];
  vagaOptions?: VagaOption[];
  onSuccess?: (triagem: Triagem) => void;
  onCancel?: () => void;
  redirectTo?: string;
  className?: string;
}

const etapaLabels: Record<TriagemEtapa, string> = {
  curriculo: "Triagem de Currículo",
  testes: "Testes / Avaliação",
  entrevista_rh: "Entrevista RH",
  entrevista_gestor: "Entrevista com Gestor",
  finalizado: "Finalizado",
};

const resultadoLabels: Record<TriagemResultado, string> = {
  em_andamento: "Em Andamento",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  desistente: "Desistente",
  banco_talentos: "Banco de Talentos",
};

const motivoReprovacaoLabels: Record<(typeof motivosReprovacao)[number], string> = {
  curriculo: "Currículo / Perfil não aderente",
  fit_cultural: "Fit cultural insuficiente",
  testes: "Reprovado nos testes técnicos",
  rh: "Avaliação do RH desfavorável",
  gestor: "Avaliação do Gestor desfavorável",
};

const motivoDesistenciaLabels: Record<(typeof motivosDesistencia)[number], string> = {
  incompatibilidade_salarial: "Incompatibilidade salarial",
  aceitou_outra_proposta: "Aceitou outra proposta",
  nao_atendeu_contato: "Não atendeu contato / Incomunicável",
  motivos_pessoais: "Motivos pessoais",
};

export function TriagemForm({
  triagem,
  candidatoOptions = [],
  vagaOptions = [],
  onSuccess,
  onCancel,
  redirectTo,
  className,
}: TriagemFormProps) {
  const router = useRouter();
  const isEdit = Boolean(triagem?.id);

  const [serverError, setServerError] = React.useState<{
    message?: string;
    fieldErrors?: Record<string, string[]>;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      candidatoId: triagem?.candidatoId ?? "",
      vagaId: triagem?.vagaId ?? "",
      etapa: (triagem?.etapa ?? "curriculo") as TriagemEtapa,
      resultado: (triagem?.resultado ?? "em_andamento") as TriagemResultado,
      motivo: (triagem?.motivo ?? null) as TriagemMotivo | null,
      parecerRh: triagem?.parecerRh ?? "",
    } as z.input<typeof triagemSchema>,
    validators: {
      onBlur: triagemSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const payload = {
        ...value,
        parecerRh: value.parecerRh ? value.parecerRh : null,
        motivo:
          value.resultado === "reprovado" || value.resultado === "desistente"
            ? value.motivo || null
            : null,
      };

      const result =
        isEdit && triagem?.id
          ? await updateTriagem(triagem.id, payload)
          : await createTriagem(payload);

      if (!result.success) {
        setServerError({
          message: result.message ?? "Ocorreu um erro ao salvar a triagem.",
          fieldErrors: result.errors,
        });
        return;
      }

      if (result.data) {
        if (onSuccess) {
          onSuccess(result.data);
        } else if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push("/triagens");
        }
      }
    },
  });

  const serverErrorList = serverError?.fieldErrors
    ? Object.values(serverError.fieldErrors).flat()
    : [];

  return (
    <Card className={cn("w-full max-w-3xl", className)}>
      <CardHeader>
        <CardTitle>{isEdit ? "Editar Triagem" : "Nova Triagem"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Atualize a etapa, o resultado, o parecer do RH e os motivos da triagem."
            : "Vincule um candidato a uma vaga aberta e inicie o processo de triagem."}
        </CardDescription>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        noValidate
      >
        <CardContent className="space-y-6">
          {serverError && (
            <ErrorCallout
              title="Não foi possível salvar a triagem"
              message={serverError.message}
              errors={serverErrorList.length > 0 ? serverErrorList : undefined}
            />
          )}

          <FieldGroup>
            {/* Seção 1: Seleção de Candidato e Vaga (Apenas na Criação) */}
            {!isEdit ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <form.Field
                  name="candidatoId"
                  validators={{
                    onBlur: triagemBaseSchema.shape.candidatoId,
                  }}
                >
                  {(field) => {
                    const hasErrors = field.state.meta.errors.length > 0;
                    const fieldId = "triagem-candidato-id";
                    const errorId = `${fieldId}-error`;
                    const descId = `${fieldId}-description`;

                    return (
                      <Field data-invalid={hasErrors}>
                        <FieldLabel htmlFor={fieldId}>Candidato *</FieldLabel>
                        <Select
                          value={field.state.value || ""}
                          onValueChange={(val) => {
                            if (typeof val === "string") {
                              field.handleChange(val);
                            }
                          }}
                        >
                          <SelectTrigger
                            id={fieldId}
                            className="w-full"
                            aria-invalid={hasErrors}
                            aria-describedby={
                              hasErrors ? `${descId} ${errorId}` : descId
                            }
                          >
                            <SelectValue placeholder="Selecione um candidato...">
                              {(val: string | null) => {
                                if (!val || val === "none") {
                                  return "Selecione um candidato...";
                                }
                                const cand = candidatoOptions.find(
                                  (c) => c.id === val,
                                );
                                if (!cand) return "Selecione um candidato...";
                                return `${cand.nome} (${cand.email})`;
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {candidatoOptions.length === 0 ? (
                              <SelectItem value="none" disabled>
                                Nenhum candidato ativo disponível
                              </SelectItem>
                            ) : (
                              candidatoOptions.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nome} — {c.email}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FieldDescription id={descId}>
                          Candidato a ser avaliado no processo.
                        </FieldDescription>
                        <FieldError
                          id={errorId}
                          errors={field.state.meta.errors}
                        />
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field
                  name="vagaId"
                  validators={{
                    onBlur: triagemBaseSchema.shape.vagaId,
                  }}
                >
                  {(field) => {
                    const hasErrors = field.state.meta.errors.length > 0;
                    const fieldId = "triagem-vaga-id";
                    const errorId = `${fieldId}-error`;
                    const descId = `${fieldId}-description`;

                    return (
                      <Field data-invalid={hasErrors}>
                        <FieldLabel htmlFor={fieldId}>Vaga *</FieldLabel>
                        <Select
                          value={field.state.value || ""}
                          onValueChange={(val) => {
                            if (typeof val === "string") {
                              field.handleChange(val);
                            }
                          }}
                        >
                          <SelectTrigger
                            id={fieldId}
                            className="w-full"
                            aria-invalid={hasErrors}
                            aria-describedby={
                              hasErrors ? `${descId} ${errorId}` : descId
                            }
                          >
                            <SelectValue placeholder="Selecione uma vaga...">
                              {(val: string | null) => {
                                if (!val || val === "none") {
                                  return "Selecione uma vaga...";
                                }
                                const v = vagaOptions.find((o) => o.id === val);
                                if (!v) return "Selecione uma vaga...";
                                return `${v.cargo.titulo} (${v.cidade}/${v.uf})`;
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {vagaOptions.length === 0 ? (
                              <SelectItem value="none" disabled>
                                Nenhuma vaga ativa disponível
                              </SelectItem>
                            ) : (
                              vagaOptions.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.cargo.titulo} — {v.cargo.departamento.nome} ({v.cidade}/{v.uf})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FieldDescription id={descId}>
                          Vaga de destino para a candidatura.
                        </FieldDescription>
                        <FieldError
                          id={errorId}
                          errors={field.state.meta.errors}
                        />
                      </Field>
                    );
                  }}
                </form.Field>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Candidato
                    </span>
                    <p className="mt-1 font-medium text-foreground">
                      {triagem?.candidato?.nome ?? "Candidato vinculado"}
                    </p>
                    {triagem?.candidato?.email && (
                      <p className="text-xs text-muted-foreground">
                        {triagem.candidato.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Vaga
                    </span>
                    <p className="mt-1 font-medium text-foreground">
                      {triagem?.vaga?.cargo?.titulo ??
                        triagem?.vaga?.cargoTitulo ??
                        "Vaga vinculada"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {triagem?.vaga?.cargo?.departamento?.nome ??
                        triagem?.vaga?.departamentoNome ??
                        ""}{" "}
                      {triagem?.vaga?.cidade ? `(${triagem.vaga.cidade}/${triagem.vaga.uf})` : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Seção 2: Etapa e Resultado */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.Field
                name="etapa"
                validators={{
                  onBlur: triagemBaseSchema.shape.etapa,
                }}
              >
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const fieldId = "triagem-etapa";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>Etapa do Processo *</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(val) => {
                          if (typeof val === "string") {
                            field.handleChange(val as TriagemEtapa);
                          }
                        }}
                      >
                        <SelectTrigger
                          id={fieldId}
                          className="w-full"
                          aria-invalid={hasErrors}
                          aria-describedby={
                            hasErrors ? `${descId} ${errorId}` : descId
                          }
                        >
                          <SelectValue placeholder="Selecione a etapa...">
                            {(val: string | null) =>
                              val && val in etapaLabels
                                ? etapaLabels[val as TriagemEtapa]
                                : "Selecione a etapa..."
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(etapaLabels) as TriagemEtapa[]).map(
                            (etapa) => (
                              <SelectItem key={etapa} value={etapa}>
                                {etapaLabels[etapa]}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FieldDescription id={descId}>
                        Fase atual do candidato no pipeline seletivo.
                      </FieldDescription>
                      <FieldError
                        id={errorId}
                        errors={field.state.meta.errors}
                      />
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field
                name="resultado"
                validators={{
                  onBlur: triagemBaseSchema.shape.resultado,
                }}
              >
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const fieldId = "triagem-resultado";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>Resultado *</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(val) => {
                          if (typeof val === "string") {
                            const newRes = val as TriagemResultado;
                            field.handleChange(newRes);
                            // Limpa o motivo se não for reprovado nem desistente
                            if (newRes !== "reprovado" && newRes !== "desistente") {
                              form.setFieldValue("motivo", null);
                            }
                          }
                        }}
                      >
                        <SelectTrigger
                          id={fieldId}
                          className="w-full"
                          aria-invalid={hasErrors}
                          aria-describedby={
                            hasErrors ? `${descId} ${errorId}` : descId
                          }
                        >
                          <SelectValue placeholder="Selecione o resultado...">
                            {(val: string | null) =>
                              val && val in resultadoLabels
                                ? resultadoLabels[val as TriagemResultado]
                                : "Selecione o resultado..."
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(resultadoLabels) as TriagemResultado[]
                          ).map((res) => (
                            <SelectItem key={res} value={res}>
                              {resultadoLabels[res]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription id={descId}>
                        Status de conclusão ou andamento da triagem.
                      </FieldDescription>
                      <FieldError
                        id={errorId}
                        errors={field.state.meta.errors}
                      />
                    </Field>
                  );
                }}
              </form.Field>
            </div>

            {/* Seção 3: Motivo Condicional (Exibido apenas para Reprovado ou Desistente) */}
            <form.Subscribe
              selector={(state) => state.values.resultado}
            >
              {(resultado) => {
                const isReprovado = resultado === "reprovado";
                const isDesistente = resultado === "desistente";
                const showMotivo = isReprovado || isDesistente;

                if (!showMotivo) return null;

                return (
                  <form.Field
                    name="motivo"
                    validators={{
                      onBlur: ({ value }) => {
                        if (isReprovado) {
                          if (!value) return "Motivo é obrigatório para candidato reprovado";
                          if (!motivosReprovacao.includes(value as any)) {
                            return "Motivo de reprovação inválido";
                          }
                        } else if (isDesistente) {
                          if (!value) return "Motivo é obrigatório para candidato desistente";
                          if (!motivosDesistencia.includes(value as any)) {
                            return "Motivo de desistência inválido";
                          }
                        }
                        return undefined;
                      },
                    }}
                  >
                    {(field) => {
                      const hasErrors = field.state.meta.errors.length > 0;
                      const fieldId = "triagem-motivo";
                      const errorId = `${fieldId}-error`;
                      const descId = `${fieldId}-description`;

                      const currentLabels = isReprovado
                        ? motivoReprovacaoLabels
                        : motivoDesistenciaLabels;
                      const currentOptions = isReprovado
                        ? motivosReprovacao
                        : motivosDesistencia;

                      return (
                        <Field data-invalid={hasErrors}>
                          <FieldLabel htmlFor={fieldId}>
                            Motivo da {isReprovado ? "Reprovação" : "Desistência"} *
                          </FieldLabel>
                          <Select
                            value={field.state.value || ""}
                            onValueChange={(val) => {
                              if (typeof val === "string") {
                                field.handleChange(val as TriagemMotivo);
                              }
                            }}
                          >
                            <SelectTrigger
                              id={fieldId}
                              className="w-full"
                              aria-invalid={hasErrors}
                              aria-describedby={
                                hasErrors ? `${descId} ${errorId}` : descId
                              }
                            >
                              <SelectValue placeholder="Selecione o motivo...">
                                {(val: string | null) => {
                                  if (!val || val === "none") {
                                    return "Selecione o motivo...";
                                  }
                                  return (currentLabels as Record<string, string>)[val] ?? val;
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {currentOptions.map((motivo) => (
                                <SelectItem key={motivo} value={motivo}>
                                  {(currentLabels as Record<string, string>)[motivo]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldDescription id={descId}>
                            Justificativa obrigatória para{" "}
                            {isReprovado ? "reprovação" : "desistência"} do processo.
                          </FieldDescription>
                          <FieldError
                            id={errorId}
                            errors={field.state.meta.errors}
                          />
                        </Field>
                      );
                    }}
                  </form.Field>
                );
              }}
            </form.Subscribe>

            {/* Seção 4: Parecer RH */}
            <form.Field name="parecerRh">
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                const fieldId = "triagem-parecer-rh";
                const errorId = `${fieldId}-error`;
                const descId = `${fieldId}-description`;

                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={fieldId}>Parecer do RH</FieldLabel>
                    <Textarea
                      id={fieldId}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Registre as impressões gerais, feedback das entrevistas e alinhamentos com o gestor..."
                      rows={4}
                      aria-invalid={hasErrors}
                      aria-describedby={
                        hasErrors ? `${descId} ${errorId}` : descId
                      }
                    />
                    <FieldDescription id={descId}>
                      Observações detalhadas da equipe de RH sobre o candidato.
                    </FieldDescription>
                    <FieldError
                      id={errorId}
                      errors={field.state.meta.errors}
                    />
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          )}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <FormSubmitButton
                pending={Boolean(isSubmitting)}
                disabled={!canSubmit}
                loadingText="Salvando..."
                className="w-full sm:w-auto"
              >
                {isEdit ? "Salvar Alterações" : "Criar Triagem"}
              </FormSubmitButton>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
