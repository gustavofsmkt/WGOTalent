"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import type { z } from "zod";
import {
  triagemSchema,
  triagemBaseSchema,
  motivosReprovacao,
  motivosDesistencia,
  type TriagemMotivo,
} from "~/lib/validation/triagem";
import { createTriagem } from "~/actions/triagens";
import type { Triagem } from "~/server/db/schema";
import {
  etapaLabels,
  resultadoLabels,
  motivoReprovacaoLabels,
  motivoDesistenciaLabels,
} from "~/lib/triagem-format";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FormSubmitButton } from "~/components/form-submit-button";
import { ErrorCallout } from "~/components/error-callout";
import { cn } from "~/lib/utils";

export interface CandidatoOption {
  id: string;
  nome: string;
  email: string | null;
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
  candidatoOptions?: CandidatoOption[];
  vagaOptions?: VagaOption[];
  onSuccess?: (triagem: Triagem) => void;
  redirectTo?: string;
  className?: string;
}

export function TriagemForm({
  candidatoOptions = [],
  vagaOptions = [],
  onSuccess,
  redirectTo,
  className,
}: TriagemFormProps) {
  const router = useRouter();

  const [serverError, setServerError] = React.useState<{
    message?: string;
    fieldErrors?: Record<string, string[]>;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      candidatoId: "",
      vagaId: "",
      etapa: "curriculo",
      resultado: "em_andamento",
      motivo: null,
    } as z.input<typeof triagemSchema>,
    validators: {
      onBlur: triagemSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const payload = {
        ...value,
        motivo:
          value.resultado === "reprovado" || value.resultado === "desistente"
            ? value.motivo || null
            : null,
      };

      const result = await createTriagem(payload);

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
        <CardTitle>Nova Triagem</CardTitle>
        <CardDescription>
          Vincule um candidato a uma vaga aberta e inicie o processo de triagem.
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
            {/* Seção 1: Seleção de Candidato e Vaga */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.Field
                name="candidatoId"
                validators={{
                  onBlur: triagemBaseSchema.shape.candidatoId,
                }}
              >
                {(field) => {
                  const hasErrors =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
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
                  const hasErrors =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
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
                                {v.cargo.titulo} — {v.cargo.departamento.nome} (
                                {v.cidade}/{v.uf})
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

            {/* Seção 2: Etapa e Resultado */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.Field
                name="etapa"
                validators={{
                  onBlur: triagemBaseSchema.shape.etapa,
                }}
              >
                {(field) => {
                  const hasErrors =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
                  const fieldId = "triagem-etapa";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>
                        Etapa do Processo *
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(val) => {
                          if (typeof val === "string") {
                            field.handleChange(val as typeof field.state.value);
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
                                ? etapaLabels[val as keyof typeof etapaLabels]
                                : "Selecione a etapa..."
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(
                              etapaLabels,
                            ) as (keyof typeof etapaLabels)[]
                          ).map((etapa) => (
                            <SelectItem key={etapa} value={etapa}>
                              {etapaLabels[etapa]}
                            </SelectItem>
                          ))}
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
                  const hasErrors =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
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
                            const newRes = val as typeof field.state.value;
                            field.handleChange(newRes);
                            // Limpa o motivo se não for reprovado nem desistente
                            if (
                              newRes !== "reprovado" &&
                              newRes !== "desistente"
                            ) {
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
                                ? resultadoLabels[
                                    val as keyof typeof resultadoLabels
                                  ]
                                : "Selecione o resultado..."
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(
                              resultadoLabels,
                            ) as (keyof typeof resultadoLabels)[]
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
            <form.Subscribe selector={(state) => state.values.resultado}>
              {(resultado) => {
                const isReprovado = resultado === "reprovado";
                const isDesistente = resultado === "desistente";
                const showMotivo = isReprovado || isDesistente;

                if (!showMotivo) return null;

                return (
                  // A validação de obrigatoriedade/consistência de `motivo` já vive em
                  // `triagemSchema.superRefine` (~/lib/validation/triagem.ts) e é aplicada
                  // pelo validator onBlur do form — não duplicar a regra aqui.
                  <form.Field name="motivo">
                    {(field) => {
                      const hasErrors =
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0;
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
                            Motivo da{" "}
                            {isReprovado ? "Reprovação" : "Desistência"} *
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
                                  return (
                                    (currentLabels as Record<string, string>)[
                                      val
                                    ] ?? val
                                  );
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {currentOptions.map((motivo) => (
                                <SelectItem key={motivo} value={motivo}>
                                  {
                                    (currentLabels as Record<string, string>)[
                                      motivo
                                    ]
                                  }
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldDescription id={descId}>
                            Justificativa obrigatória para{" "}
                            {isReprovado ? "reprovação" : "desistência"} do
                            processo.
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
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
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
                Criar Triagem
              </FormSubmitButton>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
