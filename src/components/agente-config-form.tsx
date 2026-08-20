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
import { FormSubmitButton } from "~/components/form-submit-button";
import { ErrorCallout } from "~/components/error-callout";

const CATALOGO_VARIAVEIS: Record<AgenteConfig["slot"], string> = {
  extracao_curriculo:
    "Este slot não recebe variáveis de contexto — a entrada é o arquivo do currículo em si (multimodal) ou seu texto convertido (DOCX).",
  classificador_aderencia:
    "{{tipo_principal}}, {{tipo_comparacao}} (rótulos, ex: \"candidato\"/\"vaga\"), {{item_principal}} (JSON do lado \"1\"), {{itens_comparacao}} (JSON array do lado \"N\").",
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
          message: result.message ?? "Ocorreu um erro ao salvar a configuração.",
          fieldErrors: result.errors,
        });
        return;
      }

      router.push("/admin/agentes");
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
          Variáveis disponíveis no template desta task: {CATALOGO_VARIAVEIS[agenteConfig.slot]}
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
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor="agente-provider">Provedor</FieldLabel>
                  <Input
                    id="agente-provider"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="model">
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor="agente-model">Modelo</FieldLabel>
                  <Input
                    id="agente-model"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="systemPrompt">
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor="agente-system-prompt">System Prompt</FieldLabel>
                  <Textarea
                    id="agente-system-prompt"
                    name={field.name}
                    rows={6}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="userPrompt">
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor="agente-user-prompt">User Prompt</FieldLabel>
                  <Textarea
                    id="agente-user-prompt"
                    name={field.name}
                    rows={6}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldDescription>
                    Use as variáveis listadas acima entre chaves duplas, ex: {"{{tipo_principal}}"}.
                  </FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            {agenteConfig.slot === "classificador_aderencia" && (
              <form.Field name="thresholdScore">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor="agente-threshold">Threshold de aprovação (0–100)</FieldLabel>
                    <Input
                      id="agente-threshold"
                      name={field.name}
                      type="number"
                      min={0}
                      max={100}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(e.target.value === "" ? null : Number(e.target.value))
                      }
                    />
                    <FieldDescription>
                      Pares com score abaixo deste valor não viram Triagem.
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            )}

            <form.Field name="ativo">
              {(field) => (
                <Field orientation="horizontal" className="items-start gap-3 pt-2">
                  <Checkbox
                    id="agente-ativo"
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
                    onBlur={field.handleBlur}
                  />
                  <div>
                    <FieldLabel htmlFor="agente-ativo">Agente ativo</FieldLabel>
                    <FieldDescription>
                      Quando desativado, o disparo deste agente falha explicitamente.
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

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
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
