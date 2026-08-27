"use client";

import { useRouter } from "next/navigation";
import {
  agenteConfigUpdateSchema,
  type AgenteConfigUpdateInput,
  type LlmParamsInput,
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
  FieldLabel,
  FieldDescription,
  FieldError,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { toastActionPromise } from "~/lib/toast-promise";
import { useAppForm } from "~/hooks/form";
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

  // A extração envia PDF/imagem multimodal — só oferece provedores capazes disso.
  const providerOptions = LLM_PROVIDERS.filter(
    (p) =>
      agenteConfig.slot !== "extracao_curriculo" || p.capabilities.multimodalPdf,
  ).map((p) => ({ value: p.value, label: p.label }));

  const paramsIniciais = (agenteConfig.params ?? {}) as LlmParamsInput;

  const form = useAppForm({
    defaultValues: {
      provider: agenteConfig.provider,
      model: agenteConfig.model,
      systemPrompt: agenteConfig.systemPrompt,
      userPrompt: agenteConfig.userPrompt,
      params: {
        temperature: paramsIniciais.temperature ?? null,
        maxOutputTokens: paramsIniciais.maxOutputTokens ?? null,
        topP: paramsIniciais.topP ?? null,
      },
      thresholdScore: agenteConfig.thresholdScore
        ? Number(agenteConfig.thresholdScore)
        : null,
      ativo: agenteConfig.ativo,
    } as unknown as AgenteConfigUpdateInput,
    validators: {
      onBlur: agenteConfigUpdateSchema,
    },
    onSubmit: ({ value }) => {
      const req = updateAgenteConfig(agenteConfig.slot, normalizarParams(value));

      toastActionPromise(req, {
        loading: "Salvando configuração do agente...",
        success: "Configuração salva com sucesso!",
        onSuccess: () => {
          router.push("/admin");
          router.refresh();
        },
      });
    },
  });

  return (
    <Card className="w-full">
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
        className="flex flex-col gap-4"
      >
        <CardContent className="space-y-4">
          <form.AppField
            name="provider"
            listeners={{
              onChange: ({ value }) => {
                const firstModel = getModelsForProvider(value)[0]?.value ?? "";
                form.setFieldValue("model", firstModel);
              },
            }}
          >
            {(field) => (
              <field.SelectField label="Provedor" options={providerOptions} />
            )}
          </form.AppField>

          <form.Subscribe selector={(state) => state.values.provider}>
            {(provider) => {
              const modelos = getModelsForProvider(provider);
              return (
                <form.AppField name="model">
                  {(field) => (
                    <field.SelectField
                      label="Modelo"
                      description="Modelos disponíveis para o provedor selecionado acima."
                      options={modelos.map((m) => ({
                        value: m.value,
                        label: m.label,
                      }))}
                    />
                  )}
                </form.AppField>
              );
            }}
          </form.Subscribe>

          <form.AppField name="systemPrompt">
            {(field) => (
              <field.TextAreaField label="System Prompt" rows={6} />
            )}
          </form.AppField>

          <form.AppField name="userPrompt">
            {(field) => (
              <field.TextAreaField
                label="User Prompt"
                description={`Use as variáveis listadas acima entre chaves duplas, ex: {{tipo_principal}}.`}
                rows={6}
              />
            )}
          </form.AppField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <form.Field name="params.temperature">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="agente-temperature">
                    Temperature
                  </FieldLabel>
                  <Input
                    id="agente-temperature"
                    name={field.name}
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                  <FieldDescription>
                    0–2. Vazio = default do provedor.
                  </FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="params.maxOutputTokens">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="agente-max-tokens">
                    Máx. tokens de saída
                  </FieldLabel>
                  <Input
                    id="agente-max-tokens"
                    name={field.name}
                    type="number"
                    min={1}
                    max={32000}
                    step={1}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                  <FieldDescription>Inteiro. Vazio = default.</FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="params.topP">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="agente-top-p">Top-P</FieldLabel>
                  <Input
                    id="agente-top-p"
                    name={field.name}
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                  <FieldDescription>0–1. Vazio = default.</FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          </div>

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

          <form.AppField name="ativo">
            {(field) => (
              <field.CheckboxField
                label="Agente ativo"
                description="Quando desativado, o disparo deste agente falha explicitamente."
              />
            )}
          </form.AppField>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>

          <form.AppForm>
            <form.SaveButton label="Salvar Alterações" />
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}

/** O form usa `null` para "campo numérico vazio"; a action/Zod esperam a chave ausente. */
function normalizarParams(value: AgenteConfigUpdateInput): AgenteConfigUpdateInput {
  const p = (value.params ?? {}) as Record<string, number | null | undefined>;
  const limpos: Record<string, number> = {};
  for (const chave of ["temperature", "maxOutputTokens", "topP"] as const) {
    const v = p[chave];
    if (typeof v === "number" && !Number.isNaN(v)) limpos[chave] = v;
  }
  return {
    ...value,
    params: Object.keys(limpos).length > 0 ? limpos : null,
  } as AgenteConfigUpdateInput;
}
