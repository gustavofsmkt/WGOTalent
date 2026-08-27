"use client";

import { useRouter } from "next/navigation";
import {
  vagaSchema,
  STATUS_VAGA_VALUES,
  type StatusVaga,
} from "~/lib/validation/vaga";
import { useAppForm } from "~/hooks/form";
import { createVaga, updateVaga } from "~/actions/vagas";
import type { Vaga } from "~/server/db/schema";
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
import { Button } from "~/components/ui/button";
import { toastActionPromise } from "~/lib/toast-promise";
import { cn } from "~/lib/utils";

export interface CargoOption {
  id: string;
  titulo: string;
  departamento?: {
    id?: string;
    nome: string;
  } | null;
}

export interface CidadeOption {
  id: string;
  nome: string;
  uf: string;
}

export interface VagaFormProps {
  vaga?: {
    id: string;
    cargoId: string;
    status: StatusVaga;
    posicoesDisponiveis: number;
    remuneracaoOferecida?: string | null;
    cidade: string;
    uf: string;
  } | null;
  cargoOptions: CargoOption[];
  cidadeOptions: CidadeOption[];
  onSuccess?: (vaga: Vaga) => void;
  onCancel?: () => void;
  redirectTo?: string;
  className?: string;
}

const statusLabels: Record<StatusVaga, string> = {
  aberta: "Aberta",
  pausada: "Pausada",
  concluida: "Concluída",
  cancelada: "Cancelada",
  incompleta: "Incompleta",
};

export function VagaForm({
  vaga,
  cargoOptions,
  cidadeOptions,
  onSuccess,
  onCancel,
  redirectTo,
  className,
}: VagaFormProps) {
  const router = useRouter();
  const isEdit = Boolean(vaga?.id);

  const form = useAppForm({
    defaultValues: {
      cargoId: vaga?.cargoId ?? "",
      status: (vaga?.status ?? "aberta") as StatusVaga,
      posicoesDisponiveis: vaga?.posicoesDisponiveis ?? 1,
      remuneracaoOferecida: (vaga?.remuneracaoOferecida
        ? String(vaga.remuneracaoOferecida)
        : "") as string,
      cidade: vaga?.cidade ?? "",
      uf: vaga?.uf ?? "",
    },
    validators: {
      onBlur: vagaSchema,
    },
    onSubmit: ({ value }) => {
      const req =
        isEdit && vaga?.id
          ? updateVaga(vaga.id, value)
          : createVaga(value);

      toastActionPromise(req, {
        loading: isEdit ? "Atualizando vaga..." : "Cadastrando vaga...",
        success: isEdit ? "Vaga atualizada com sucesso!" : "Vaga cadastrada com sucesso!",
        onSuccess: ({ data }) => {
          if (onSuccess) onSuccess(data!);
          else if (redirectTo) router.push(redirectTo);
          else router.push("/vagas");
        },
      });
    },
  });

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{isEdit ? "Editar Vaga" : "Nova Vaga"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Atualize as informações, status e posições da vaga."
            : "Preencha os dados necessários para cadastrar e abrir uma nova vaga."}
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
        className="flex flex-col gap-4"
      >
        <CardContent>
          <FieldGroup>
            {/* Linha 1: Cargo e Status */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.AppField
                name="cargoId"
                validators={{ onBlur: vagaSchema.shape.cargoId }}
              >
                {(field) => (
                  <field.SelectField
                    label="Cargo"
                    required
                    placeholder="Selecione um cargo..."
                    description="Cargo ao qual esta vaga pertence."
                    options={cargoOptions.map((cargo) => ({
                      value: cargo.id,
                      label: cargo.departamento?.nome
                        ? `${cargo.titulo} (${cargo.departamento.nome})`
                        : cargo.titulo,
                    }))}
                  />
                )}
              </form.AppField>

              <form.AppField
                name="status"
                validators={{ onBlur: vagaSchema.shape.status }}
              >
                {(field) => (
                  <field.SelectField
                    label="Status da Vaga"
                    required
                    placeholder="Selecione o status..."
                    description="Situação atual do processo de recrutamento da vaga."
                    options={STATUS_VAGA_VALUES.map((s) => ({
                      value: s,
                      label: statusLabels[s],
                    }))}
                  />
                )}
              </form.AppField>
            </div>

            {/* Linha 2: Posições e Remuneração */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.Field
                name="posicoesDisponiveis"
                validators={{
                  onBlur: vagaSchema.shape.posicoesDisponiveis,
                }}
              >
                {(field) => {
                  const hasErrors =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
                  const fieldId = "vaga-posicoes-disponiveis";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>
                        Posições Disponíveis *
                      </FieldLabel>
                      <Input
                        id={fieldId}
                        name={field.name}
                        type="number"
                        min={1}
                        max={32767}
                        step={1}
                        placeholder="1"
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={hasErrors}
                        aria-describedby={
                          hasErrors ? `${descId} ${errorId}` : descId
                        }
                        autoComplete="off"
                      />
                      <FieldDescription id={descId}>
                        Quantidade de vagas abertas para este cargo (mínimo 1).
                      </FieldDescription>
                      <FieldError
                        id={errorId}
                        errors={field.state.meta.errors}
                      />
                    </Field>
                  );
                }}
              </form.Field>

              <form.AppField
                name="remuneracaoOferecida"
                validators={{ onBlur: vagaSchema.shape.remuneracaoOferecida }}
              >
                {(field) => (
                  <field.InputField
                    label="Remuneração Oferecida (R$)"
                    type="number"
                    placeholder="Ex: 6500.00 ou 6.500,00"
                    description="Valor salarial oferecido para a posição (opcional)."
                    autoComplete="off"
                  />
                )}
              </form.AppField>
            </div>

            {/* Linha 3: Cidade */}
            <form.Field
              name="cidade"
              validators={{ onBlur: vagaSchema.shape.cidade }}
            >
              {(cidadeField) => (
                <form.Field
                  name="uf"
                  validators={{ onBlur: vagaSchema.shape.uf }}
                >
                  {(ufField) => {
                    const selectedOption =
                      cidadeOptions.find(
                        (o) =>
                          o.nome === cidadeField.state.value &&
                          o.uf === ufField.state.value,
                      ) ?? null;

                    const hasErrors =
                      (cidadeField.state.meta.isTouched &&
                        cidadeField.state.meta.errors.length > 0) ||
                      (ufField.state.meta.isTouched &&
                        ufField.state.meta.errors.length > 0);

                    const fieldId = "vaga-cidade";
                    const errorId = `${fieldId}-error`;
                    const descId = `${fieldId}-description`;

                    return (
                      <Field data-invalid={hasErrors}>
                        <FieldLabel htmlFor={fieldId}>Cidade *</FieldLabel>
                        <Select
                          value={selectedOption?.id ?? ""}
                          onValueChange={(val) => {
                            const option = cidadeOptions.find(
                              (o) => o.id === val,
                            );
                            if (option) {
                              cidadeField.handleChange(option.nome);
                              ufField.handleChange(option.uf);
                              cidadeField.handleBlur();
                              ufField.handleBlur();
                            }
                          }}
                        >
                          <SelectTrigger
                            id={fieldId}
                            className="w-full"
                            aria-invalid={hasErrors}
                            aria-describedby={
                              hasErrors ? `${descId} ${errorId}` : descId
                            }
                          >
                            <SelectValue placeholder="Selecione uma cidade...">
                              {(val: string | null) => {
                                if (!val) return "Selecione uma cidade...";
                                const o = cidadeOptions.find(
                                  (c) => c.id === val,
                                );
                                return o
                                  ? `${o.nome} - ${o.uf}`
                                  : "Selecione uma cidade...";
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {cidadeOptions.length === 0 ? (
                              <SelectItem value="none" disabled>
                                Nenhuma cidade cadastrada
                              </SelectItem>
                            ) : (
                              cidadeOptions.map((o) => (
                                <SelectItem key={o.id} value={o.id}>
                                  {o.nome} - {o.uf}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FieldDescription id={descId}>
                          Município de atuação da vaga. Cadastre cidades em
                          Administração → Configurações Gerais.
                        </FieldDescription>
                        <FieldError
                          id={errorId}
                          errors={[
                            ...cidadeField.state.meta.errors,
                            ...ufField.state.meta.errors,
                          ]}
                        />
                      </Field>
                    );
                  }}
                </form.Field>
              )}
            </form.Field>
          </FieldGroup>
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
              label={isEdit ? "Salvar Alterações" : "Criar Vaga"}
            />
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}
