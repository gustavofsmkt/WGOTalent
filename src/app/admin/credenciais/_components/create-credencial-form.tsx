"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import {
  credencialCreateSchema,
  type CredencialCreateInput,
} from "~/lib/validation/credencial";
import { createCredencial } from "~/actions/credenciais";
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
import { FormSubmitButton } from "~/components/form-submit-button";
import { ErrorCallout } from "~/components/error-callout";
import { LLM_PROVIDERS } from "~/lib/agents/provider-catalog";

export function CreateCredencialForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<{
    message?: string;
    fieldErrors?: Record<string, string[]>;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      provider: LLM_PROVIDERS[0]?.value ?? "",
      apiKey: "",
    } as CredencialCreateInput,
    validators: { onBlur: credencialCreateSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await createCredencial(value);

      if (!result.success) {
        setServerError({
          message: result.message ?? "Ocorreu um erro ao salvar a credencial.",
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
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Nova Credencial</CardTitle>
        <CardDescription>
          A API key é cifrada antes de ser salva e nunca é reexibida — para trocar, cadastre uma
          nova e desative a antiga.
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
              title="Não foi possível salvar a credencial"
              message={serverError.message}
              errors={serverErrorList.length > 0 ? serverErrorList : undefined}
            />
          )}

          <FieldGroup>
            <form.Field name="provider">
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched && field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor="credencial-provider">Provedor</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => {
                        if (typeof val === "string") field.handleChange(val);
                      }}
                    >
                      <SelectTrigger id="credencial-provider" className="w-full" aria-invalid={hasErrors}>
                        <SelectValue placeholder="Selecione um provedor...">
                          {(val: string | null) =>
                            LLM_PROVIDERS.find((p) => p.value === val)?.label ??
                            "Selecione um provedor..."
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {LLM_PROVIDERS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      A credencial cadastrada aqui é a usada por todos os agentes configurados
                      para este provedor.
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="apiKey">
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched && field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor="credencial-api-key">API Key</FieldLabel>
                    <Input
                      id="credencial-api-key"
                      name={field.name}
                      type="password"
                      autoComplete="off"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={hasErrors}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-3">
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <FormSubmitButton
                pending={Boolean(isSubmitting)}
                disabled={!canSubmit || Boolean(isSubmitting)}
                loadingText="Salvando..."
              >
                Salvar Credencial
              </FormSubmitButton>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
