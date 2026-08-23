"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import {
  departamentoSchema,
  type CreateDepartamentoInput,
} from "~/lib/validation/departamento";
import {
  createDepartamento,
  updateDepartamento,
} from "~/actions/departamentos";
import type { Departamento } from "~/server/db/schema";
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
import { Button } from "~/components/ui/button";
import { FormSubmitButton } from "~/components/form-submit-button";
import { ErrorCallout } from "~/components/error-callout";
import { cn } from "~/lib/utils";

export interface DepartamentoFormProps {
  departamento?: {
    id: string;
    nome: string;
    descricao: string;
  } | null;
  onSuccess?: (departamento: Departamento) => void;
  onCancel?: () => void;
  redirectTo?: string;
  className?: string;
}

export function DepartamentoForm({
  departamento,
  onSuccess,
  onCancel,
  redirectTo,
  className,
}: DepartamentoFormProps) {
  const router = useRouter();
  const isEdit = Boolean(departamento?.id);

  const [serverError, setServerError] = React.useState<{
    message?: string;
    fieldErrors?: Record<string, string[]>;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      nome: departamento?.nome ?? "",
      descricao: departamento?.descricao ?? "",
    } as CreateDepartamentoInput,
    validators: {
      onBlur: departamentoSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const result =
        isEdit && departamento?.id
          ? await updateDepartamento(departamento.id, value)
          : await createDepartamento(value);

      if (!result.success) {
        setServerError({
          message:
            result.message ?? "Ocorreu um erro ao salvar o departamento.",
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
          router.push("/departamentos");
        }
      }
    },
  });

  const serverErrorList = serverError?.fieldErrors
    ? Object.values(serverError.fieldErrors).flat()
    : [];

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle>
          {isEdit ? "Editar Departamento" : "Novo Departamento"}
        </CardTitle>
        <CardDescription>
          {isEdit
            ? "Atualize as informações cadastrais do departamento."
            : "Preencha as informações para cadastrar um novo departamento."}
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
              title="Não foi possível salvar o departamento"
              message={serverError.message}
              errors={serverErrorList.length > 0 ? serverErrorList : undefined}
            />
          )}

          <FieldGroup>
            <form.Field
              name="nome"
              validators={{
                onBlur: departamentoSchema.shape.nome,
              }}
            >
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched && field.state.meta.errors.length > 0;
                const fieldId = "departamento-nome";
                const errorId = `${fieldId}-error`;
                const descId = `${fieldId}-description`;

                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={fieldId}>
                      Nome do Departamento *
                    </FieldLabel>
                    <Input
                      id={fieldId}
                      name={field.name}
                      placeholder="Ex: Tecnologia da Informação"
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
                      Nome único que identifica o departamento (máx. 120
                      caracteres).
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
              name="descricao"
              validators={{
                onBlur: departamentoSchema.shape.descricao,
              }}
            >
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched && field.state.meta.errors.length > 0;
                const fieldId = "departamento-descricao";
                const errorId = `${fieldId}-error`;
                const descId = `${fieldId}-description`;

                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor={fieldId}>
                      Descrição do Departamento *
                    </FieldLabel>
                    <Textarea
                      id={fieldId}
                      name={field.name}
                      placeholder="Descreva as principais atribuições e escopo de atuação deste departamento..."
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
                      Detalhamento das responsabilidades e atribuições do
                      departamento.
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
                {isEdit ? "Salvar Alterações" : "Criar Departamento"}
              </FormSubmitButton>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
