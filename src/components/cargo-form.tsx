"use client";

import { useRouter } from "next/navigation";
import { cargoSchema, type CreateCargoInput } from "~/lib/validation/cargo";
import { createCargo, updateCargo } from "~/actions/cargos";
import type { Cargo } from "~/server/db/schema";
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

  const form = useAppForm({
    defaultValues: {
      departamentoId: cargo?.departamentoId ?? "",
      titulo: cargo?.titulo ?? "",
      descricao: cargo?.descricao ?? "",
      ativo: cargo?.ativo ?? true,
      faixaSalarial: (cargo?.faixaSalarial
        ? String(cargo.faixaSalarial)
        : "") as string,
      requisitos: cargo?.requisitos ?? "",
      requisitosDesejaveis: cargo?.requisitosDesejaveis ?? "",
      criteriosEliminatorios: cargo?.criteriosEliminatorios ?? "",
    } as CreateCargoInput,
    validators: {
      onBlur: cargoSchema,
    },
    onSubmit: ({ value }) => {
      const req =
        isEdit && cargo?.id ? updateCargo(cargo.id, value) : createCargo(value);

      toastActionPromise(req, {
        loading: isEdit ? "Atualizando cargo..." : "Cadastrando cargo...",
        success: isEdit
          ? "Cargo atualizado com sucesso!"
          : "Cargo cadastrado com sucesso!",
        onSuccess: ({ data }) => {
          if (onSuccess) onSuccess(data!);
          else if (redirectTo) router.push(redirectTo);
          else router.push("/cargos");
        },
      });
    },
  });

  return (
    <Card className={cn("w-full", className)}>
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
        className="flex flex-col gap-4"
      >
        <CardContent>
          <div className="flex flex-col gap-5">
            {/* Linha 1: Título e Departamento */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.AppField
                name="titulo"
                validators={{ onBlur: cargoSchema.shape.titulo }}
              >
                {(field) => (
                  <field.InputField
                    label="Título do Cargo"
                    required
                    placeholder="Ex: Desenvolvedor Full Stack"
                    description="Título do cargo (máx. 150 caracteres)."
                    autoComplete="off"
                  />
                )}
              </form.AppField>

              <form.AppField
                name="departamentoId"
                validators={{ onBlur: cargoSchema.shape.departamentoId }}
              >
                {(field) => (
                  <field.SelectField
                    label="Departamento"
                    required
                    placeholder="Selecione um departamento..."
                    description="Departamento ao qual o cargo está subordinado."
                    options={departamentoOptions.map((d) => ({
                      value: d.id,
                      label: d.nome,
                    }))}
                  />
                )}
              </form.AppField>
            </div>

            {/* Linha 2: Faixa Salarial e Status Ativo */}
            <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
              <form.AppField
                name="faixaSalarial"
                validators={{ onBlur: cargoSchema.shape.faixaSalarial }}
              >
                {(field) => (
                  <field.InputField
                    label="Faixa Salarial (R$)"
                    type="number"
                    placeholder="Ex: 8500.00 ou 8.500,00"
                    description="Remuneração referencial numérica (opcional)."
                    autoComplete="off"
                  />
                )}
              </form.AppField>

              <form.AppField
                name="ativo"
                validators={{ onBlur: cargoSchema.shape.ativo }}
              >
                {(field) => (
                  <field.CheckboxField
                    label="Cargo Ativo"
                    description="Cargos ativos ficam disponíveis para novas vagas."
                  />
                )}
              </form.AppField>
            </div>

            {/* Linha 3: Descrição Geral */}
            <form.AppField
              name="descricao"
              validators={{ onBlur: cargoSchema.shape.descricao }}
            >
              {(field) => (
                <field.TextAreaField
                  label="Descrição do Cargo"
                  required
                  rows={4}
                  placeholder="Descreva as principais atribuições e responsabilidades do cargo..."
                  description="Síntese das atividades e escopo de atuação."
                />
              )}
            </form.AppField>

            {/* Linha 4: Requisitos Obrigatórios */}
            <form.AppField
              name="requisitos"
              validators={{ onBlur: cargoSchema.shape.requisitos }}
            >
              {(field) => (
                <field.TextAreaField
                  label="Requisitos Obrigatórios"
                  required
                  rows={3}
                  placeholder="Liste as competências, formação técnica ou tempo de experiência indispensáveis..."
                  description="Requisitos mínimos e mandatórios para o cargo."
                />
              )}
            </form.AppField>

            {/* Linha 5: Requisitos Desejáveis */}
            <form.AppField
              name="requisitosDesejaveis"
              validators={{ onBlur: cargoSchema.shape.requisitosDesejaveis }}
            >
              {(field) => (
                <field.TextAreaField
                  label="Requisitos Desejáveis"
                  required
                  rows={3}
                  placeholder="Liste conhecimentos ou experiências que contam como diferenciais competitivos..."
                  description="Diferenciais que agregam valor na triagem."
                />
              )}
            </form.AppField>

            {/* Linha 6: Critérios Eliminatórios */}
            <form.AppField
              name="criteriosEliminatorios"
              validators={{ onBlur: cargoSchema.shape.criteriosEliminatorios }}
            >
              {(field) => (
                <field.TextAreaField
                  label="Critérios Eliminatórios"
                  required
                  rows={3}
                  placeholder="Liste fatores determinantes que desqualificam a candidatura automaticamente..."
                  description="Condições que impedem a aprovação do candidato."
                />
              )}
            </form.AppField>
          </div>
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
              label={isEdit ? "Salvar Alterações" : "Criar Cargo"}
            />
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}
