"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import type { z } from "zod";
import { createCidadeSchema } from "~/lib/validation/cidade";
import { BRAZILIAN_UFS } from "~/lib/validation/common";
import { createCidade } from "~/actions/cidades";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
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
import { FormSubmitButton } from "~/components/form-submit-button";
import { ErrorCallout } from "~/components/error-callout";

export function CreateCidadeForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<{
    message?: string;
    fieldErrors?: Record<string, string[]>;
  } | null>(null);

  const form = useForm({
    defaultValues: { nome: "", uf: "" } as z.input<typeof createCidadeSchema>,
    validators: { onBlur: createCidadeSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await createCidade(value);

      if (!result.success) {
        setServerError({
          message: result.message ?? "Ocorreu um erro ao salvar a cidade.",
          fieldErrors: result.errors,
        });
        return;
      }

      form.reset();
      router.refresh();
    },
  });

  const serverErrorList = serverError?.fieldErrors
    ? Object.values(serverError.fieldErrors).flat()
    : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nova Cidade</CardTitle>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (form.state.isSubmitting) return;
          void form.handleSubmit();
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <CardContent>
          {serverError && (
            <ErrorCallout
              title="Não foi possível salvar a cidade"
              message={serverError.message}
              errors={serverErrorList.length > 0 ? serverErrorList : undefined}
            />
          )}

          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <form.Field name="nome">
                  {(field) => {
                    const hasErrors =
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0;
                    return (
                      <Field data-invalid={hasErrors}>
                        <FieldLabel htmlFor="cidade-nome">Cidade *</FieldLabel>
                        <Input
                          id="cidade-nome"
                          name={field.name}
                          type="text"
                          placeholder="Ex: São Paulo"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={hasErrors}
                          autoComplete="off"
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    );
                  }}
                </form.Field>
              </div>

              <div>
                <form.Field name="uf">
                  {(field) => {
                    const hasErrors =
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0;
                    return (
                      <Field data-invalid={hasErrors}>
                        <FieldLabel htmlFor="cidade-uf">UF *</FieldLabel>
                        <Select
                          value={field.state.value || ""}
                          onValueChange={(val) => {
                            if (typeof val === "string") {
                              field.handleChange(val);
                              field.handleBlur();
                            }
                          }}
                        >
                          <SelectTrigger
                            id="cidade-uf"
                            className="w-full"
                            aria-invalid={hasErrors}
                          >
                            <SelectValue placeholder="UF...">
                              {(val: string | null) => val || "UF..."}
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
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    );
                  }}
                </form.Field>
              </div>
            </div>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex items-center justify-end">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <FormSubmitButton
                pending={Boolean(isSubmitting)}
                disabled={!canSubmit || Boolean(isSubmitting)}
                loadingText="Salvando..."
              >
                Adicionar Cidade
              </FormSubmitButton>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
