"use client";

import { useRouter } from "next/navigation";
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
import { toastActionPromise } from "~/lib/toast-promise";
import { useAppForm } from "~/hooks/form";

function tresMesesAtras(): string {
  const data = new Date();
  data.setMonth(data.getMonth() - 3);
  return data.toISOString().slice(0, 10);
}

export function CreateEmailCredencialForm() {
  const router = useRouter();

  const form = useAppForm({
    defaultValues: {
      host: "",
      porta: 993,
      usuario: "",
      senha: "",
      pasta: "INBOX",
      capturarDesde: "",
    } as EmailCredencialCreateInput,
    validators: { onBlur: emailCredencialCreateSchema },
    onSubmit: ({ value }) => {
      const req = createEmailCredencial(value);

      toastActionPromise(req, {
        loading: "Salvando credencial de e-mail...",
        success: "Credencial de e-mail salva com sucesso!",
        onSuccess: () => {
          form.reset();
          router.refresh();
        },
      });
    },
  });

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
          void form.handleSubmit();
        }}
        noValidate
        className="gap-4 flex flex-col"
      >
        <CardContent>
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <form.AppField name="host">
                {(field) => (
                  <field.InputField
                    label="Host IMAP"
                    placeholder="imap.gmail.com"
                  />
                )}
              </form.AppField>
            </div>

            {/* porta kept as raw field — needs Number() coercion on change */}
            <div className="sm:col-span-1">
              <form.Field name="porta">
                {(field) => {
                  const hasErrors =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={hasErrors}>
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
            </div>
          </FieldGroup>

          <FieldGroup>
            <form.AppField name="usuario">
              {(field) => (
                <field.InputField label="Usuário" autoComplete="off" />
              )}
            </form.AppField>

            <form.AppField name="senha">
              {(field) => (
                <field.InputField
                  label="Senha (ou senha de app, se o provedor exigir)"
                  type="password"
                  autoComplete="off"
                  description="Gmail exige uma Senha de App (não a senha normal da conta) desde 2022."
                />
              )}
            </form.AppField>
          </FieldGroup>

          <form.AppField name="pasta">
            {(field) => (
              <field.InputField label="Pasta monitorada" />
            )}
          </form.AppField>

          {/* capturarDesde kept as raw field — description contains JSX */}
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

        <CardFooter className="flex items-center justify-end gap-4">
          <form.AppForm>
            <form.SaveButton label="Salvar Credencial" />
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}
