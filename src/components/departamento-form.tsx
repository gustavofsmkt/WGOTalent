"use client";

import { useRouter } from "next/navigation";
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
import { Button } from "~/components/ui/button";
import { toastActionPromise } from "~/lib/toast-promise";
import { useAppForm } from "~/hooks/form";
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

  const form = useAppForm({
    defaultValues: {
      nome: departamento?.nome ?? "",
      descricao: departamento?.descricao ?? "",
    } as CreateDepartamentoInput,
    validators: {
      onBlur: departamentoSchema,
    },
    onSubmit: ({ value }) => {
      const req =
        isEdit && departamento?.id
          ? updateDepartamento(departamento.id, value)
          : createDepartamento(value);

      toastActionPromise(req, {
        loading: isEdit
          ? "Atualizando departamento..."
          : "Cadastrando departamento...",
        success: isEdit
          ? "Departamento atualizado com sucesso!"
          : "Departamento cadastrado com sucesso!",
        onSuccess: ({ data }) => {
          if (onSuccess) onSuccess(data!);
          else if (redirectTo) router.push(redirectTo);
          else router.push("/departamentos");
        },
      });
    },
  });

  return (
    <Card className={cn("w-full", className)}>
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
        className="flex flex-col gap-4"
      >
        <CardContent>
          <form.AppField
            name="nome"
            validators={{ onBlur: departamentoSchema.shape.nome }}
          >
            {(field) => (
              <field.InputField
                label="Nome do Departamento"
                required
                placeholder="Ex: Tecnologia da Informação"
                description="Nome único que identifica o departamento (máx. 120 caracteres)."
                autoComplete="off"
              />
            )}
          </form.AppField>

          <form.AppField
            name="descricao"
            validators={{ onBlur: departamentoSchema.shape.descricao }}
          >
            {(field) => (
              <field.TextAreaField
                label="Descrição do Departamento"
                required
                placeholder="Descreva as principais atribuições e escopo de atuação deste departamento..."
                description="Detalhamento das responsabilidades e atribuições do departamento."
                rows={4}
              />
            )}
          </form.AppField>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-4">
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

          <form.AppForm>
            <form.SaveButton
              label={isEdit ? "Salvar Alterações" : "Criar Departamento"}
            />
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}
