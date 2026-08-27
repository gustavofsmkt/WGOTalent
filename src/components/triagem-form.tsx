"use client";

import { useRouter } from "next/navigation";
import {
  triagemSchema,
  triagemBaseSchema,
  motivosReprovacao,
  motivosDesistencia,
} from "~/lib/validation/triagem";
import { createTriagem } from "~/actions/triagens";
import type { Triagem } from "~/server/db/schema";
import {
  etapaLabels,
  resultadoLabels,
  motivoReprovacaoLabels,
  motivoDesistenciaLabels,
} from "~/lib/triagem-format";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { toastActionPromise } from "~/lib/toast-promise";
import { useAppForm } from "~/hooks/form";
import { cn } from "~/lib/utils";

export interface CandidatoOption {
  id: string;
  nome: string;
  email: string | null;
}

export interface VagaOption {
  id: string;
  status: string;
  cidade: string;
  uf: string;
  cargo: {
    titulo: string;
    departamento: {
      nome: string;
    };
  };
}

export interface TriagemFormProps {
  candidatoOptions?: CandidatoOption[];
  vagaOptions?: VagaOption[];
  onSuccess?: (triagem: Triagem) => void;
  redirectTo?: string;
  className?: string;
}

export function TriagemForm({
  candidatoOptions = [],
  vagaOptions = [],
  onSuccess,
  redirectTo,
  className,
}: TriagemFormProps) {
  const router = useRouter();

  const form = useAppForm({
    defaultValues: {
      candidatoId: "",
      vagaId: "",
      etapa: "curriculo" as string,
      resultado: "em_andamento" as string,
      motivo: null as string | null,
    },
    validators: {
      onBlur: triagemSchema,
    },
    onSubmit: ({ value }) => {
      const payload = {
        ...value,
        motivo:
          value.resultado === "reprovado" || value.resultado === "desistente"
            ? value.motivo || null
            : null,
      };

      const req = createTriagem(payload);

      toastActionPromise(req, {
        loading: "Criando triagem...",
        success: "Triagem criada com sucesso!",
        onSuccess: ({ data }) => {
          if (onSuccess) onSuccess(data!);
          else if (redirectTo) router.push(redirectTo);
          else router.push("/triagens");
        },
      });
    },
  });

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Nova Triagem</CardTitle>
        <CardDescription>
          Vincule um candidato a uma vaga aberta e inicie o processo de triagem.
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
            {/* Seção 1: Seleção de Candidato e Vaga */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.AppField
                name="candidatoId"
                validators={{ onBlur: triagemBaseSchema.shape.candidatoId }}
              >
                {(field) => (
                  <field.SelectField
                    label="Candidato"
                    required
                    placeholder="Selecione um candidato..."
                    description="Candidato a ser avaliado no processo."
                    options={candidatoOptions.map((c) => ({
                      value: c.id,
                      label: `${c.nome} — ${c.email}`,
                    }))}
                  />
                )}
              </form.AppField>

              <form.AppField
                name="vagaId"
                validators={{ onBlur: triagemBaseSchema.shape.vagaId }}
              >
                {(field) => (
                  <field.SelectField
                    label="Vaga"
                    required
                    placeholder="Selecione uma vaga..."
                    description="Vaga de destino para a candidatura."
                    options={vagaOptions.map((v) => ({
                      value: v.id,
                      label: `${v.cargo.titulo} — ${v.cargo.departamento.nome} (${v.cidade}/${v.uf})`,
                    }))}
                  />
                )}
              </form.AppField>
            </div>

            {/* Seção 2: Etapa e Resultado */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <form.AppField
                name="etapa"
                validators={{ onBlur: triagemBaseSchema.shape.etapa }}
              >
                {(field) => (
                  <field.SelectField
                    label="Etapa do Processo"
                    required
                    placeholder="Selecione a etapa..."
                    description="Fase atual do candidato no pipeline seletivo."
                    options={(
                      Object.keys(etapaLabels) as (keyof typeof etapaLabels)[]
                    ).map((e) => ({
                      value: e,
                      label: etapaLabels[e],
                    }))}
                  />
                )}
              </form.AppField>

              <form.AppField
                name="resultado"
                validators={{ onBlur: triagemBaseSchema.shape.resultado }}
                listeners={{
                  onChange: ({ value }) => {
                    if (value !== "reprovado" && value !== "desistente") {
                      form.setFieldValue("motivo", null);
                    }
                  },
                }}
              >
                {(field) => (
                  <field.SelectField
                    label="Resultado"
                    required
                    placeholder="Selecione o resultado..."
                    description="Status de conclusão ou andamento da triagem."
                    options={(
                      Object.keys(
                        resultadoLabels,
                      ) as (keyof typeof resultadoLabels)[]
                    ).map((r) => ({
                      value: r,
                      label: resultadoLabels[r],
                    }))}
                  />
                )}
              </form.AppField>
            </div>

            {/* Seção 3: Motivo Condicional (Exibido apenas para Reprovado ou Desistente) */}
            <form.Subscribe selector={(state) => state.values.resultado}>
              {(resultado) => {
                const isReprovado = resultado === "reprovado";
                const isDesistente = resultado === "desistente";
                if (!isReprovado && !isDesistente) return null;

                const currentLabels = isReprovado
                  ? motivoReprovacaoLabels
                  : motivoDesistenciaLabels;
                const currentOptions = isReprovado
                  ? motivosReprovacao
                  : motivosDesistencia;

                return (
                  // A validação de obrigatoriedade/consistência de `motivo` já vive em
                  // `triagemSchema.superRefine` (~/lib/validation/triagem.ts).
                  <form.AppField name="motivo">
                    {(field) => (
                      <field.SelectField
                        label={`Motivo da ${isReprovado ? "Reprovação" : "Desistência"}`}
                        required
                        placeholder="Selecione o motivo..."
                        description={`Justificativa obrigatória para ${isReprovado ? "reprovação" : "desistência"} do processo.`}
                        options={currentOptions.map((m) => ({
                          value: m,
                          label:
                            (currentLabels as Record<string, string>)[m] ?? m,
                        }))}
                      />
                    )}
                  </form.AppField>
                );
              }}
            </form.Subscribe>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse justify-end gap-4 sm:flex-row">
          <form.AppForm>
            <form.SaveButton
              label="Criar Triagem"
              className="w-full sm:w-auto"
            />
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}
