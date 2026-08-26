"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import {
  agenteConfigUpdateSchema,
  type AgenteConfigUpdateInput,
} from "~/lib/validation/agente-config";
import { updateAgenteConfig } from "~/actions/agente-config";
import type { AgenteConfig } from "~/server/db/schema";
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
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FormSubmitButton } from "~/components/form-submit-button";
import { ErrorCallout } from "~/components/error-callout";
import {
  LLM_PROVIDERS,
  getModelsForProvider,
} from "~/lib/agents/provider-catalog";

const CATALOGO_VARIAVEIS: Record<AgenteConfig["slot"], string> = {
  extracao_curriculo:
    "Este slot não recebe variáveis de contexto — a entrada é o arquivo do currículo em si (multimodal) ou seu texto convertido (DOCX).",
  classificador_aderencia:
    '{{tipo_principal}}, {{tipo_comparacao}} (rótulos, ex: "candidato"/"vaga"), {{item_principal}} (JSON do lado "1"), {{itens_comparacao}} (JSON array do lado "N").',
  avaliador_triagem:
    "{{candidato}} (JSON de CandidatoCompleto), {{vaga}} (JSON de VagaCompleta).",
};

export interface AgenteConfigFormProps {
  agenteConfig: AgenteConfig;
}

export function AgenteConfigForm({ agenteConfig }: AgenteConfigFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<{
    message?: string;
    fieldErrors?: Record<string, string[]>;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      provider: agenteConfig.provider,
      model: agenteConfig.model,
      systemPrompt: agenteConfig.systemPrompt,
      userPrompt: agenteConfig.userPrompt,
      thresholdScore: agenteConfig.thresholdScore
        ? Number(agenteConfig.thresholdScore)
        : null,
      ativo: agenteConfig.ativo,
    } as AgenteConfigUpdateInput,
    validators: {
      onBlur: agenteConfigUpdateSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const result = await updateAgenteConfig(agenteConfig.slot, value);

      if (!result.success) {
        setServerError({
          message:
            result.message ?? "Ocorreu um erro ao salvar a configuração.",
          fieldErrors: result.errors,
        });
        return;
      }

      router.push("/admin");
      router.refresh();
    },
  });

  const serverErrorList = serverError?.fieldErrors
    ? Object.values(serverError.fieldErrors).flat()
    : [];

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Agente: {agenteConfig.slot}</CardTitle>
        <CardDescription>
          Variáveis disponíveis no template desta task:{" "}
          {CATALOGO_VARIAVEIS[agenteConfig.slot]}
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
              title="Não foi possível salvar a configuração"
              message={serverError.message}
              errors={serverErrorList.length > 0 ? serverErrorList : undefined}
            />
          )}

          <FieldGroup>
            <form.Field name="provider">
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor="agente-provider">Provedor</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => {
                        if (typeof val !== "string") return;
                        field.handleChange(val);
                        // Provedor mudou: o modelo atual pode não existir no novo
                        // catálogo — reseta para o primeiro modelo disponível.
                        const primeiroModelo =
                          getModelsForProvider(val)[0]?.value ?? "";
                        form.setFieldValue("model", primeiroModelo);
                      }}
                    >
                      <SelectTrigger
                        id="agente-provider"
                        className="w-full"
                        aria-invalid={hasErrors}
                      >
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
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.provider}>
              {(provider) => {
                const modelos = getModelsForProvider(provider);
                return (
                  <form.Field name="model">
                    {(field) => {
                      const hasErrors =
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0;
                      return (
                        <Field data-invalid={hasErrors}>
                          <FieldLabel htmlFor="agente-model">Modelo</FieldLabel>
                          <Select
                            value={field.state.value}
                            onValueChange={(val) => {
                              if (typeof val === "string")
                                field.handleChange(val);
                            }}
                          >
                            <SelectTrigger
                              id="agente-model"
                              className="w-full"
                              aria-invalid={hasErrors}
                            >
                              <SelectValue placeholder="Selecione um modelo...">
                                {(val: string | null) =>
                                  modelos.find((m) => m.value === val)?.label ??
                                  "Selecione um modelo..."
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {modelos.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  Nenhum modelo disponível para este provedor
                                </SelectItem>
                              ) : (
                                modelos.map((m) => (
                                  <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FieldDescription>
                            Modelos disponíveis para o provedor selecionado
                            acima.
                          </FieldDescription>
                          <FieldError errors={field.state.meta.errors} />
                        </Field>
                      );
                    }}
                  </form.Field>
                );
              }}
            </form.Subscribe>

            <form.Field name="systemPrompt">
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor="agente-system-prompt">
                      System Prompt
                    </FieldLabel>
                    <Textarea
                      id="agente-system-prompt"
                      name={field.name}
                      rows={6}
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

            <form.Field name="userPrompt">
              {(field) => {
                const hasErrors =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={hasErrors}>
                    <FieldLabel htmlFor="agente-user-prompt">
                      User Prompt
                    </FieldLabel>
                    <Textarea
                      id="agente-user-prompt"
                      name={field.name}
                      rows={6}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={hasErrors}
                    />
                    <FieldDescription>
                      Use as variáveis listadas acima entre chaves duplas, ex:{" "}
                      {"{{tipo_principal}}"}.
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                );
              }}
            </form.Field>

            {agenteConfig.slot === "classificador_aderencia" && (
              <form.Field name="thresholdScore">
                {(field) => {
                  const hasErrors =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={hasErrors}>
                      <FieldLabel htmlFor="agente-threshold">
                        Threshold de aprovação (0–100)
                      </FieldLabel>
                      <Input
                        id="agente-threshold"
                        name={field.name}
                        type="number"
                        min={0}
                        max={100}
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                        aria-invalid={hasErrors}
                      />
                      <FieldDescription>
                        Pares com score abaixo deste valor não viram Triagem.
                      </FieldDescription>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  );
                }}
              </form.Field>
            )}

            <form.Field name="ativo">
              {(field) => (
                <Field
                  orientation="horizontal"
                  className="items-start gap-3 pt-2"
                >
                  <Checkbox
                    id="agente-ativo"
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(Boolean(checked))
                    }
                    onBlur={field.handleBlur}
                  />
                  <div>
                    <FieldLabel htmlFor="agente-ativo">Agente ativo</FieldLabel>
                    <FieldDescription>
                      Quando desativado, o disparo deste agente falha
                      explicitamente.
                    </FieldDescription>
                  </div>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <FormSubmitButton
                pending={Boolean(isSubmitting)}
                disabled={!canSubmit || Boolean(isSubmitting)}
                loadingText="Salvando..."
              >
                Salvar Alterações
              </FormSubmitButton>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
