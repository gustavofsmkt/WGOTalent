"use client";

import { useRouter } from "next/navigation";
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
import { toast } from "~/components/ui/toast";
import { useAppForm } from "~/hooks/form";

export function CreateCidadeForm() {
  const router = useRouter();

  const form = useAppForm({
    defaultValues: { nome: "", uf: "" },
    validators: { onBlur: createCidadeSchema },
    onSubmit: ({ value }) => {
      const req = createCidade(value);

      toast.promise(req, {
        loading: "Salvando cidade...",
        success: (result) => {
          if (!result.success)
            throw new Error(result.message ?? "Erro ao salvar a cidade.");
          form.reset();
          router.refresh();
          return "Cidade adicionada com sucesso!";
        },
        error: (err: unknown) =>
          err instanceof Error ? err.message : "Ocorreu um erro inesperado.",
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nova Cidade</CardTitle>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <form.AppField
                name="nome"
                validators={{ onBlur: createCidadeSchema.shape.nome }}
              >
                {(field) => (
                  <field.InputField
                    label="Cidade"
                    required
                    placeholder="Ex: São Paulo"
                    autoComplete="off"
                  />
                )}
              </form.AppField>
            </div>

            <div>
              <form.AppField
                name="uf"
                validators={{ onBlur: createCidadeSchema.shape.uf }}
              >
                {(field) => (
                  <field.SelectField
                    label="UF"
                    required
                    placeholder="UF..."
                    options={BRAZILIAN_UFS.map((uf) => ({ value: uf, label: uf }))}
                  />
                )}
              </form.AppField>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-end">
          <form.AppForm>
            <form.SaveButton label="Adicionar Cidade" />
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}
