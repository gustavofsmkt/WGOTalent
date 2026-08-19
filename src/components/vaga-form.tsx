"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import type { z } from "zod";
import {
  vagaSchema,
  STATUS_VAGA_VALUES,
  type StatusVaga,
  type CreateVagaInput,
} from "~/lib/validation/vaga";
import { BRAZILIAN_UFS } from "~/lib/validation/common";
import { createVaga, updateVaga } from "~/actions/vagas";
import type { Vaga } from "~/server/db/schema";
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
import { Input } from "~/components/ui/input";
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

export interface CargoOption {
  id: string;
  titulo: string;
  departamento?: {
    id?: string;
    nome: string;
  } | null;
}

export interface VagaFormProps {
  vaga?: {
    id: string;
    cargoId: string;
    status: StatusVaga;
    posicoesDisponiveis: number;
    remuneracaoOferecida?: string | null;
    cidade: string;
    uf: string;
  } | null;
  cargoOptions: CargoOption[];
  onSuccess?: (vaga: Vaga) => void;
  onCancel?: () => void;
  redirectTo?: string;
  className?: string;
}

const statusLabels: Record<StatusVaga, string> = {
  aberta: "Aberta",
  pausada: "Pausada",
  concluida: "Concluída",
  cancelada: "Cancelada",
  incompleta: "Incompleta",
};

export function VagaForm({
  vaga,
  cargoOptions,
  onSuccess,
  onCancel,
  redirectTo,
  className,
}: VagaFormProps) {
  const router = useRouter();
  const isEdit = Boolean(vaga?.id);

  const [serverError, setServerError] = React.useState<{
    message?: string;
    fieldErrors?: Record<string, string[]>;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      cargoId: vaga?.cargoId ?? "",
      status: (vaga?.status ?? "aberta") as StatusVaga,
      posicoesDisponiveis: (vaga?.posicoesDisponiveis ?? 1) as any,
      remuneracaoOferecida: (vaga?.remuneracaoOferecida
        ? String(vaga.remuneracaoOferecida)
        : "") as string,
      cidade: vaga?.cidade ?? "",
      uf: (vaga?.uf ?? "") as any,
    } as z.input<typeof vagaSchema>,
    validators: {
      onBlur: vagaSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const result =
        isEdit && vaga?.id
          ? await updateVaga(vaga.id, value)
          : await createVaga(value);

      if (!result.success) {
        setServerError({
          message: result.message ?? "Ocorreu um erro ao salvar a vaga.",
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
          router.push("/vagas");
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
        <CardTitle>{isEdit ? "Editar Vaga" : "Nova Vaga"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Atualize as informações, status e posições da vaga."
            : "Preencha os dados necessários para cadastrar e abrir uma nova vaga."}
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
              title="Não foi possível salvar a vaga"
              message={serverError.message}
              errors={serverErrorList.length > 0 ? serverErrorList : undefined}
            />
          )}

          <FieldGroup>
            {/* Linha 1: Cargo e Status */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.Field
                name="cargoId"
                validators={{
                  onBlur: vagaSchema.shape.cargoId,
                }}
              >
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const fieldId = "vaga-cargo-id";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>Cargo *</FieldLabel>
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
                          <SelectValue placeholder="Selecione um cargo...">
                            {(val: string | null) => {
                              if (!val || val === "none") {
                                return "Selecione um cargo...";
                              }
                              const cargo = cargoOptions.find(
                                (c) => c.id === val,
                              );
                              if (!cargo) return "Selecione um cargo...";
                              return cargo.departamento?.nome
                                ? `${cargo.titulo} (${cargo.departamento.nome})`
                                : cargo.titulo;
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {cargoOptions.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhum cargo ativo disponível
                            </SelectItem>
                          ) : (
                            cargoOptions.map((cargo) => (
                              <SelectItem key={cargo.id} value={cargo.id}>
                                {cargo.titulo}
                                {cargo.departamento?.nome
                                  ? ` — ${cargo.departamento.nome}`
                                  : ""}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FieldDescription id={descId}>
                        Cargo ao qual esta vaga pertence.
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
                name="status"
                validators={{
                  onBlur: vagaSchema.shape.status,
                }}
              >
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const fieldId = "vaga-status";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>
                        Status da Vaga *
                      </FieldLabel>
                      <Select
                        value={field.state.value || "aberta"}
                        onValueChange={(val) => {
                          if (typeof val === "string") {
                            field.handleChange(val as StatusVaga);
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
                          <SelectValue placeholder="Selecione o status...">
                            {(val: string | null) => {
                              if (!val) return "Selecione o status...";
                              return statusLabels[val as StatusVaga] ?? val;
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_VAGA_VALUES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusLabels[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription id={descId}>
                        Situação atual do processo de recrutamento da vaga.
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

            {/* Linha 2: Posições e Remuneração */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.Field
                name="posicoesDisponiveis"
                validators={{
                  onBlur: vagaSchema.shape.posicoesDisponiveis,
                }}
              >
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const fieldId = "vaga-posicoes-disponiveis";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>
                        Posições Disponíveis *
                      </FieldLabel>
                      <Input
                        id={fieldId}
                        name={field.name}
                        type="number"
                        min={1}
                        max={32767}
                        step={1}
                        placeholder="1"
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value === "" ? ("" as any) : e.target.value,
                          )
                        }
                        aria-invalid={hasErrors}
                        aria-describedby={
                          hasErrors ? `${descId} ${errorId}` : descId
                        }
                        autoComplete="off"
                      />
                      <FieldDescription id={descId}>
                        Quantidade de vagas abertas para este cargo (mínimo 1).
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
                name="remuneracaoOferecida"
                validators={{
                  onBlur: vagaSchema.shape.remuneracaoOferecida,
                }}
              >
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const fieldId = "vaga-remuneracao-oferecida";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>
                        Remuneração Oferecida (R$)
                      </FieldLabel>
                      <Input
                        id={fieldId}
                        name={field.name}
                        type="text"
                        placeholder="Ex: 6500.00 ou 6.500,00"
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={hasErrors}
                        aria-describedby={
                          hasErrors ? `${descId} ${errorId}` : descId
                        }
                        autoComplete="off"
                      />
                      <FieldDescription id={descId}>
                        Valor salarial oferecido para a posição (opcional).
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

            {/* Linha 3: Cidade e UF */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="md:col-span-2">
                <form.Field
                  name="cidade"
                  validators={{
                    onBlur: vagaSchema.shape.cidade,
                  }}
                >
                  {(field) => {
                    const hasErrors = field.state.meta.errors.length > 0;
                    const fieldId = "vaga-cidade";
                    const errorId = `${fieldId}-error`;
                    const descId = `${fieldId}-description`;

                    return (
                      <Field data-invalid={hasErrors}>
                        <FieldLabel htmlFor={fieldId}>Cidade *</FieldLabel>
                        <Input
                          id={fieldId}
                          name={field.name}
                          type="text"
                          placeholder="Ex: São Paulo"
                          value={field.state.value ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={hasErrors}
                          aria-describedby={
                            hasErrors ? `${descId} ${errorId}` : descId
                          }
                          autoComplete="off"
                        />
                        <FieldDescription id={descId}>
                          Município de atuação da vaga (máx. 100 caracteres).
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

              <div>
                <form.Field
                  name="uf"
                  validators={{
                    onBlur: vagaSchema.shape.uf,
                  }}
                >
                  {(field) => {
                    const hasErrors = field.state.meta.errors.length > 0;
                    const fieldId = "vaga-uf";
                    const errorId = `${fieldId}-error`;
                    const descId = `${fieldId}-description`;

                    return (
                      <Field data-invalid={hasErrors}>
                        <FieldLabel htmlFor={fieldId}>UF (Estado) *</FieldLabel>
                        <Select
                          value={field.state.value || ""}
                          onValueChange={(val) => {
                            if (typeof val === "string") {
                              field.handleChange(val as any);
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
                            <SelectValue placeholder="Selecione...">
                              {(val: string | null) =>
                                val || "Selecione..."
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {BRAZILIAN_UFS.map((uf) => (
                              <SelectItem key={uf} value={uf}>
                                {uf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription id={descId}>
                          Unidade Federativa.
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
            </div>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-3">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
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
                disabled={!canSubmit || Boolean(isSubmitting)}
                loadingText={isEdit ? "Atualizando..." : "Cadastrando..."}
              >
                {isEdit ? "Salvar Alterações" : "Criar Vaga"}
              </FormSubmitButton>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
