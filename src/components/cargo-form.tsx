"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import type { z } from "zod";
import {
  cargoSchema,
  type CreateCargoInput,
} from "~/lib/validation/cargo";
import {
  createCargo,
  updateCargo,
} from "~/actions/cargos";
import type { Cargo } from "~/server/db/schema";
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
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
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

export interface DepartamentoOption {
  id: string;
  nome: string;
}

export interface CargoFormProps {
  cargo?: {
    id: string;
    departamentoId: string;
    titulo: string;
    descricao: string;
    ativo: boolean;
    faixaSalarial?: string | null;
    requisitos: string;
    requisitosDesejaveis: string;
    criteriosEliminatorios: string;
  } | null;
  departamentoOptions: DepartamentoOption[];
  onSuccess?: (cargo: Cargo) => void;
  onCancel?: () => void;
  redirectTo?: string;
  className?: string;
}

export function CargoForm({
  cargo,
  departamentoOptions,
  onSuccess,
  onCancel,
  redirectTo,
  className,
}: CargoFormProps) {
  const router = useRouter();
  const isEdit = Boolean(cargo?.id);

  const [serverError, setServerError] = React.useState<{
    message?: string;
    fieldErrors?: Record<string, string[]>;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      departamentoId: cargo?.departamentoId ?? "",
      titulo: cargo?.titulo ?? "",
      descricao: cargo?.descricao ?? "",
      ativo: cargo?.ativo ?? true,
      faixaSalarial: (cargo?.faixaSalarial ? String(cargo.faixaSalarial) : "") as string,
      requisitos: cargo?.requisitos ?? "",
      requisitosDesejaveis: cargo?.requisitosDesejaveis ?? "",
      criteriosEliminatorios: cargo?.criteriosEliminatorios ?? "",
    } as z.input<typeof cargoSchema>,
    validators: {
      onBlur: cargoSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const result =
        isEdit && cargo?.id
          ? await updateCargo(cargo.id, value)
          : await createCargo(value);

      if (!result.success) {
        setServerError({
          message: result.message ?? "Ocorreu um erro ao salvar o cargo.",
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
          router.push("/cargos");
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
        <CardTitle>{isEdit ? "Editar Cargo" : "Novo Cargo"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Atualize as informações cadastrais e requisitos do cargo."
            : "Preencha as informações para cadastrar um novo cargo na organização."}
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
              title="Não foi possível salvar o cargo"
              message={serverError.message}
              errors={serverErrorList.length > 0 ? serverErrorList : undefined}
            />
          )}

          <FieldGroup>
            {/* Linha 1: Título e Departamento */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.Field
                name="titulo"
                validators={{
                  onBlur: cargoSchema.shape.titulo,
                }}
              >
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const fieldId = "cargo-titulo";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>
                        Título do Cargo *
                      </FieldLabel>
                      <Input
                        id={fieldId}
                        name={field.name}
                        placeholder="Ex: Desenvolvedor Full Stack"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={hasErrors}
                        aria-describedby={
                          hasErrors ? `${descId} ${errorId}` : descId
                        }
                        autoComplete="off"
                      />
                      <FieldDescription id={descId}>
                        Título do cargo (máx. 150 caracteres).
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
                name="departamentoId"
                validators={{
                  onBlur: cargoSchema.shape.departamentoId,
                }}
              >
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const fieldId = "cargo-departamento-id";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>
                        Departamento *
                      </FieldLabel>
                      <Select
                        value={field.state.value || undefined}
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
                          <SelectValue placeholder="Selecione um departamento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {departamentoOptions.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhum departamento disponível
                            </SelectItem>
                          ) : (
                            departamentoOptions.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FieldDescription id={descId}>
                        Departamento ao qual o cargo está subordinado.
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

            {/* Linha 2: Faixa Salarial e Status Ativo */}
            <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
              <form.Field
                name="faixaSalarial"
                validators={{
                  onBlur: cargoSchema.shape.faixaSalarial,
                }}
              >
                {(field) => {
                  const hasErrors = field.state.meta.errors.length > 0;
                  const fieldId = "cargo-faixa-salarial";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>
                        Faixa Salarial (R$)
                      </FieldLabel>
                      <Input
                        id={fieldId}
                        name={field.name}
                        placeholder="Ex: 8500.00 ou 8.500,00"
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
                        Remuneração referencial numérica (opcional).
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
                name="ativo"
                validators={{
                  onBlur: cargoSchema.shape.ativo,
                }}
              >
                {(field) => {
                  const fieldId = "cargo-ativo";
                  const descId = `${fieldId}-description`;

                  return (
                    <Field orientation="horizontal" className="items-start gap-3 pt-2">
                      <Checkbox
                        id={fieldId}
                        name={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) =>
                          field.handleChange(Boolean(checked))
                        }
                        onBlur={field.handleBlur}
                        aria-describedby={descId}
                      />
                      <div className="grid gap-1 leading-none">
                        <FieldLabel
                          htmlFor={fieldId}
                          className="cursor-pointer font-medium"
                        >
                          Cargo Ativo
                        </FieldLabel>
                        <FieldDescription id={descId}>
                          Cargos ativos ficam disponíveis para novas vagas.
                        </FieldDescription>
                      </div>
                    </Field>
                  );
                }}
              </form.Field>
            </div>

            {/* Linha 3: Descrição Geral */}
            <form.Field
              name="descricao"
              validators={{
                onBlur: cargoSchema.shape.descricao,
              }}
            >
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                const fieldId = "cargo-descricao";
                const errorId = `${fieldId}-error`;
                const descId = `${fieldId}-description`;

                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={fieldId}>
                      Descrição do Cargo *
                    </FieldLabel>
                    <Textarea
                      id={fieldId}
                      name={field.name}
                      placeholder="Descreva as principais atribuições e responsabilidades do cargo..."
                      rows={4}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={hasErrors}
                      aria-describedby={
                        hasErrors ? `${descId} ${errorId}` : descId
                      }
                    />
                    <FieldDescription id={descId}>
                      Síntese das atividades e escopo de atuação.
                    </FieldDescription>
                    <FieldError
                      id={errorId}
                      errors={field.state.meta.errors}
                    />
                  </Field>
                );
              }}
            </form.Field>

            {/* Linha 4: Requisitos Obrigatórios */}
            <form.Field
              name="requisitos"
              validators={{
                onBlur: cargoSchema.shape.requisitos,
              }}
            >
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                const fieldId = "cargo-requisitos";
                const errorId = `${fieldId}-error`;
                const descId = `${fieldId}-description`;

                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={fieldId}>
                      Requisitos Obrigatórios *
                    </FieldLabel>
                    <Textarea
                      id={fieldId}
                      name={field.name}
                      placeholder="Liste as competências, formação técnica ou tempo de experiência indispensáveis..."
                      rows={3}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={hasErrors}
                      aria-describedby={
                        hasErrors ? `${descId} ${errorId}` : descId
                      }
                    />
                    <FieldDescription id={descId}>
                      Requisitos mínimos e mandatórios para o cargo.
                    </FieldDescription>
                    <FieldError
                      id={errorId}
                      errors={field.state.meta.errors}
                    />
                  </Field>
                );
              }}
            </form.Field>

            {/* Linha 5: Requisitos Desejáveis */}
            <form.Field
              name="requisitosDesejaveis"
              validators={{
                onBlur: cargoSchema.shape.requisitosDesejaveis,
              }}
            >
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                const fieldId = "cargo-requisitos-desejaveis";
                const errorId = `${fieldId}-error`;
                const descId = `${fieldId}-description`;

                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={fieldId}>
                      Requisitos Desejáveis *
                    </FieldLabel>
                    <Textarea
                      id={fieldId}
                      name={field.name}
                      placeholder="Liste conhecimentos ou experiências que contam como diferenciais competitivos..."
                      rows={3}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={hasErrors}
                      aria-describedby={
                        hasErrors ? `${descId} ${errorId}` : descId
                      }
                    />
                    <FieldDescription id={descId}>
                      Diferenciais que agregam valor na triagem.
                    </FieldDescription>
                    <FieldError
                      id={errorId}
                      errors={field.state.meta.errors}
                    />
                  </Field>
                );
              }}
            </form.Field>

            {/* Linha 6: Critérios Eliminatórios */}
            <form.Field
              name="criteriosEliminatorios"
              validators={{
                onBlur: cargoSchema.shape.criteriosEliminatorios,
              }}
            >
              {(field) => {
                const hasErrors = field.state.meta.errors.length > 0;
                const fieldId = "cargo-criterios-eliminatorios";
                const errorId = `${fieldId}-error`;
                const descId = `${fieldId}-description`;

                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={fieldId}>
                      Critérios Eliminatórios *
                    </FieldLabel>
                    <Textarea
                      id={fieldId}
                      name={field.name}
                      placeholder="Liste fatores determinantes que desqualificam a candidatura automaticamente..."
                      rows={3}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={hasErrors}
                      aria-describedby={
                        hasErrors ? `${descId} ${errorId}` : descId
                      }
                    />
                    <FieldDescription id={descId}>
                      Condições que impedem a aprovação do candidato.
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
                {isEdit ? "Salvar Alterações" : "Criar Cargo"}
              </FormSubmitButton>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
