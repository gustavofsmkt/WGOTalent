"use client";

import { useRouter } from "next/navigation";
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
import { toast } from "~/components/ui/toast";
import { useAppForm } from "~/hooks/form";
import { LLM_PROVIDERS } from "~/lib/agents/provider-catalog";

export function CreateCredencialForm() {
  const router = useRouter();
  const form = useAppForm({
    defaultValues: {
      provider: LLM_PROVIDERS[0]?.value ?? "",
      apiKey: "",
    } as CredencialCreateInput,
    validators: { onBlur: credencialCreateSchema },
    onSubmit: ({ value }) => {
      const req = createCredencial(value);

      toast.promise(req, {
        loading: "Salvando credencial...",
        success: (result) => {
          if (!result.success)
            throw new Error(result.message ?? "Erro ao salvar a credencial.");
          form.reset();
          router.refresh();
          return "Credencial salva com sucesso!";
        },
        error: (err: unknown) =>
          err instanceof Error ? err.message : "Ocorreu um erro inesperado.",
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nova Credencial</CardTitle>
        <CardDescription>
          A API key é cifrada antes de ser salva e nunca é reexibida — para
          trocar, cadastre uma nova e desative a antiga.
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
          <div className="flex flex-col gap-4">
            <form.AppField
              name="provider"
              validators={{ onBlur: credencialCreateSchema.shape.provider }}
            >
              {(field) => (
                <field.SelectField
                  label="Provedor"
                  description="A credencial cadastrada aqui é a usada por todos os agentes configurados para este provedor."
                  options={LLM_PROVIDERS.map((p) => ({
                    value: p.value,
                    label: p.label,
                  }))}
                />
              )}
            </form.AppField>

            <form.AppField
              name="apiKey"
              validators={{ onBlur: credencialCreateSchema.shape.apiKey }}
            >
              {(field) => (
                <field.InputField
                  label="API Key"
                  type="password"
                  autoComplete="off"
                />
              )}
            </form.AppField>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-end">
          <form.AppForm>
            <form.SaveButton label="Salvar Credencial" />
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}
