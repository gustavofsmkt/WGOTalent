"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, MapPin } from "lucide-react";
import {
  vagaSchema,
  notaCorteSchema,
  posicoesDisponiveisSchema,
  remuneracaoOferecidaSchema,
  statusVagaSchema,
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
import { Badge } from "~/components/ui/badge";
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
    notaCorte: string;
    remuneracaoOferecida?: string | null;
    cidadeIds: string[];
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
  const [pendingCidadeId, setPendingCidadeId] = useState<string>("");

  const form = useAppForm({
    defaultValues: {
      cargoId: vaga?.cargoId ?? "",
      status: (vaga?.status ?? "aberta") as StatusVaga,
      posicoesDisponiveis: (vaga?.posicoesDisponiveis ?? 1) as string | number,
      notaCorte: (vaga?.notaCorte ?? "65.00") as string | number,
      remuneracaoOferecida: (vaga?.remuneracaoOferecida
        ? String(vaga.remuneracaoOferecida)
        : "") as string | number | null | undefined,
      cidadeIds: vaga?.cidadeIds ?? ([] as string[]),
    },
    onSubmit: ({ value }) => {
      const req =
        isEdit && vaga?.id ? updateVaga(vaga.id, value) : createVaga(value);

      toastActionPromise(req, {
        loading: isEdit ? "Atualizando vaga..." : "Cadastrando vaga...",
        success: isEdit
          ? "Vaga atualizada com sucesso!"
          : "Vaga cadastrada com sucesso!",
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
                validators={{ onBlur: statusVagaSchema }}
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

            {/* Linha 2: Posições, nota de corte e remuneração */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <form.Field
                name="posicoesDisponiveis"
                validators={{
                  onBlur: posicoesDisponiveisSchema,
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

              <form.Field
                name="notaCorte"
                validators={{ onBlur: notaCorteSchema }}
              >
                {(field) => {
                  const hasErrors =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
                  const fieldId = "vaga-nota-corte";
                  const errorId = `${fieldId}-error`;
                  const descId = `${fieldId}-description`;

                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor={fieldId}>Nota de Corte *</FieldLabel>
                      <Input
                        id={fieldId}
                        name={field.name}
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        placeholder="65"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={hasErrors}
                        aria-describedby={
                          hasErrors ? `${descId} ${errorId}` : descId
                        }
                        autoComplete="off"
                      />
                      <FieldDescription id={descId}>
                        Aderência mínima (0–100) para criar uma triagem.
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
                validators={{ onBlur: remuneracaoOferecidaSchema }}
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

            {/* Linha 3: Cidades */}
            <form.Field
              name="cidadeIds"
              validators={{
                onBlur: vagaSchema.shape.cidadeIds,
                onChange: vagaSchema.shape.cidadeIds,
              }}
            >
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;
                const fieldId = "vaga-cidades";
                const errorId = `${fieldId}-error`;
                const descId = `${fieldId}-description`;
                const selected: string[] = field.state.value ?? [];
                const available = cidadeOptions.filter(
                  (c) => !selected.includes(c.id),
                );

                const handleAdd = () => {
                  if (!pendingCidadeId) return;
                  field.handleChange([...selected, pendingCidadeId]);
                  field.handleBlur();
                  setPendingCidadeId("");
                };

                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel>Cidades *</FieldLabel>

                    {cidadeOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        Nenhuma cidade cadastrada. Cadastre em Administração →
                        Configurações Gerais.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {/* Select + botão adicionar */}
                        <div className="flex gap-2">
                          <Select
                            value={pendingCidadeId}
                            onValueChange={setPendingCidadeId}
                            disabled={available.length === 0}
                          >
                            <SelectTrigger
                              className="flex-1"
                              aria-label="Selecione uma cidade para adicionar"
                            >
                              <SelectValue
                                placeholder={
                                  available.length === 0
                                    ? "Todas as cidades adicionadas"
                                    : "Selecione uma cidade..."
                                }
                              >
                                {(val: string | null) => {
                                  if (!val)
                                    return available.length === 0
                                      ? "Todas as cidades adicionadas"
                                      : "Selecione uma cidade...";
                                  const c = cidadeOptions.find(
                                    (o) => o.id === val,
                                  );
                                  return c
                                    ? `${c.nome} - ${c.uf}`
                                    : "Selecione uma cidade...";
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {available.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nome} - {c.uf}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAdd}
                            disabled={!pendingCidadeId}
                          >
                            <Plus className="size-4 mr-1" />
                            Adicionar cidade
                          </Button>
                        </div>

                        {/* Lista das cidades já adicionadas */}
                        {selected.length > 0 && (
                          <div
                            className="flex flex-wrap gap-2"
                            aria-label="Cidades selecionadas"
                          >
                            {selected.map((id) => {
                              const cidade = cidadeOptions.find(
                                (c) => c.id === id,
                              );
                              if (!cidade) return null;
                              return (
                                <Badge
                                  key={id}
                                  variant="secondary"
                                  className="flex items-center gap-1.5 pr-1 text-sm"
                                >
                                  <MapPin className="size-3 shrink-0" />
                                  {cidade.nome} - {cidade.uf}
                                  <button
                                    type="button"
                                    aria-label={`Remover ${cidade.nome}`}
                                    onClick={() => {
                                      field.handleChange(
                                        selected.filter((s) => s !== id),
                                      );
                                      field.handleBlur();
                                    }}
                                    className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <FieldDescription id={descId}>
                      Municípios de atuação da vaga. Adicione uma ou mais
                      cidades.
                    </FieldDescription>
                    <FieldError
                      id={errorId}
                      errors={field.state.meta.errors}
                    />
                  </Field>
                );
              }}
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
