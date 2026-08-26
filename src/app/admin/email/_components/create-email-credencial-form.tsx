"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import {
  emailCredencialCreateSchema,
  type EmailCredencialCreateInput,
} from "~/lib/validation/email-credencial";
import { createEmailCredencial } from "~/actions/email-credenciais";
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
import { FormSubmitButton } from "~/components/form-submit-button";
import { ErrorCallout } from "~/components/error-callout";

function tresMesesAtras(): string {
  const data = new Date();
  data.setMonth(data.getMonth() - 3);
  return data.toISOString().slice(0, 10);
}

export function CreateEmailCredencialForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<{
    message?: string;
    fieldErrors?: Record<string, string[]>;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      host: "",
      porta: 993,
      usuario: "",
      senha: "",
      pasta: "INBOX",
      capturarDesde: "",
    } as EmailCredencialCreateInput,
    validators: { onBlur: emailCredencialCreateSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await createEmailCredencial(value);

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
    <Card className="w-full ">
      <CardHeader>
        <CardTitle>Nova Credencial de E-mail</CardTitle>
        <CardDescription>
          A senha é cifrada antes de ser salva e nunca é reexibida — para
          trocar, cadastre uma nova. Só uma credencial fica ativa por vez:
          cadastrar uma nova desativa a anterior automaticamente.
        </CardDescription>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (form.state.isSubmitting) return;
          void form.handleSubmit();
        }}
        noValidate
        className="gap-4 flex flex-col"
      >
        <CardContent>
          {serverError && (
            <ErrorCallout
              title="Não foi possível salvar a credencial"
              message={serverError.message}
              errors={serverErrorList.length > 0 ? serverErrorList : undefined}
            />
          )}

          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <form.Field name="host">
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors} className="sm:col-span-2">
                    <FieldLabel htmlFor="email-credencial-host">
                      Host IMAP
                    </FieldLabel>
                    <Input
                      id="email-credencial-host"
                      name={field.name}
                      placeholder="imap.gmail.com"
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

            <form.Field name="porta">
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors} className="sm:col-span-1">
                    <FieldLabel htmlFor="email-credencial-porta">
                      Porta
                    </FieldLabel>
                    <Input
                      id="email-credencial-porta"
                      name={field.name}
                      type="number"
                      min={1}
                      max={65535}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                      aria-invalid={hasErrors}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <FieldGroup>
            <form.Field name="usuario">
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor="email-credencial-usuario">
                      Usuário
                    </FieldLabel>
                    <Input
                      id="email-credencial-usuario"
                      name={field.name}
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

            <form.Field name="senha">
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor="email-credencial-senha">
                      Senha (ou senha de app, se o provedor exigir)
                    </FieldLabel>
                    <Input
                      id="email-credencial-senha"
                      name={field.name}
                      type="password"
                      autoComplete="off"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={hasErrors}
                    />
                    <FieldDescription>
                      Gmail exige uma Senha de App (não a senha normal da conta)
                      desde 2022.
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <form.Field name="pasta">
            {(field) => {
              const hasErrors =
                field.state.meta.isTouched &&
                field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor="email-credencial-pasta">
                    Pasta monitorada
                  </FieldLabel>
                  <Input
                    id="email-credencial-pasta"
                    name={field.name}
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

          <form.Field name="capturarDesde">
            {(field) => {
              const hasErrors =
                field.state.meta.isTouched &&
                field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors}>
                  <FieldLabel htmlFor="email-credencial-capturar-desde">
                    Capturar e-mails a partir de
                  </FieldLabel>
                  <Input
                    id="email-credencial-capturar-desde"
                    name={field.name}
                    type="date"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={hasErrors}
                  />
                  <FieldDescription>
                    Opcional — use só na ativação inicial de uma caixa que já
                    recebe currículos há tempo (ex: indo para produção). A
                    primeira captura varre a caixa desde essa data (ex.:{" "}
                    {tresMesesAtras()} para os últimos 3 meses), em vez de
                    reprocessar tudo. Deixe em branco (padrão) para capturar só
                    o que chegar a partir de agora — o recomendado para caixas
                    de teste.
                  </FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-3">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
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
