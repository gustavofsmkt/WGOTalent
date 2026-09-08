"use client";

import { useState } from "react";
import type { ActionState } from "~/lib/action-utils";
import type { GeneratedPasswordResult } from "~/actions/usuarios";
import { createUsuarioClientSchema } from "~/lib/validation/usuario.client";
import { useAppForm } from "~/hooks/form";
import { toast } from "~/components/ui/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { GeneratedPassword } from "./generated-password";

interface CreateUsuarioFormProps {
  action: (payload: unknown) => Promise<ActionState<GeneratedPasswordResult>>;
}

export function CreateUsuarioForm({ action }: CreateUsuarioFormProps) {
  const [generated, setGenerated] = useState<GeneratedPasswordResult | null>(
    null,
  );
  const form = useAppForm({
    defaultValues: { username: "" },
    validators: { onBlur: createUsuarioClientSchema },
    onSubmit: async ({ value }) => {
      const result = await action(value);
      if (!result.success || !result.data) {
        toast.add({
          type: "error",
          description: result.message ?? "Erro ao adicionar usuário.",
        });
        return;
      }
      setGenerated(result.data);
      form.reset();
      toast.add({ type: "success", description: "Usuário adicionado." });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar usuário</CardTitle>
        <CardDescription>
          Informe apenas o nome de usuário. Uma senha numérica de 8 dígitos será
          criada automaticamente.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <CardContent className="flex flex-col gap-4">
          {generated ? (
            <GeneratedPassword
              username={generated.user.username}
              password={generated.generatedPassword}
            />
          ) : null}
          <form.AppField
            name="username"
            validators={{ onBlur: createUsuarioClientSchema.shape.username }}
          >
            {(field) => (
              <field.InputField
                label="Usuário"
                description="Use letras, números, ponto, hífen ou sublinhado."
                placeholder="ex: maria.silva"
                autoComplete="off"
                required
              />
            )}
          </form.AppField>
        </CardContent>
        <CardFooter className="justify-end">
          <form.AppForm>
            <form.SaveButton label="Adicionar usuário" />
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}
