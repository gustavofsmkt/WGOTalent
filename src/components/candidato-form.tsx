"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ReactFormExtendedApi } from "@tanstack/react-form";
import { useAppForm } from "~/hooks/form";
import {
  candidatoSchema,
  candidatoAgregadoSchema,
  formacaoBaseSchema,
  experienciaBaseSchema,
  certificacaoBaseSchema,
  type FormacaoInput,
  type ExperienciaInput,
  type CertificacaoInput,
  type CandidatoAgregadoInput,
} from "~/lib/validation/candidato";
import type { Candidato } from "~/server/db/schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import {
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Plus, Trash2, GraduationCap, Briefcase, Award } from "lucide-react";
import { cn } from "~/lib/utils";
import { createCandidato, updateCandidato } from "~/actions/candidatos";
import { toastActionPromise } from "~/lib/toast-promise";

export interface DepartamentoOption {
  id: string;
  nome: string;
}

export interface CargoOption {
  id: string;
  titulo: string;
  departamento: {
    id: string;
    nome: string;
  };
}

/**
 * Alias para a instância do form tipada pelo shape agregado do candidato.
 * Os parâmetros de validators/eventos ficam `any` (não afetam o shape de
 * `values`/`field.state`) para evitar repetir os 11 generics de
 * `ReactFormExtendedApi` em cada seção — usado como prop nas seções abaixo
 * em vez de `form: any`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- mirrors TanStack Form's
   own useFormContext() signature, which hardcodes `any` for these 11 slots;
   each has a constraint (e.g. `undefined | FormValidateOrFn<TFormData>`) that
   `unknown` does not satisfy, so `any` is the only substitute that compiles. */
type CandidatoFormApi = ReactFormExtendedApi<
  CandidatoAgregadoInput,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
> & {
  AppField: any;
  AppForm: any;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const ESTADO_CIVIL_OPTIONS = [
  { value: "nao_informado", label: "Não Informado" },
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União Estável" },
];

const ORIGEM_OPTIONS = [
  { value: "email", label: "E-mail" },
  { value: "manual", label: "Cadastro Manual" },
  { value: "indicacao", label: "Indicação" },
];

const CNH_OPTIONS = [
  { value: "none", label: "Não informada" },
  { value: "a", label: "A (Moto)" },
  { value: "b", label: "B (Carro)" },
  { value: "ab", label: "AB (Moto e Carro)" },
  { value: "c", label: "C (Caminhão)" },
  { value: "d", label: "D (Ônibus)" },
  { value: "e", label: "E (Carreta)" },
];

export interface CandidatoBaseFormProps {
  candidato?:
    | (Partial<Candidato> & {
        formacoes?: FormacaoInput[];
        experiencias?: ExperienciaInput[];
        certificacoes?: CertificacaoInput[];
      })
    | null;
  departamentoOptions: DepartamentoOption[];
  cargoOptions: CargoOption[];
  onSuccess?: (candidato: Candidato) => void;
  onCancel?: () => void;
  redirectTo?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Seções Compostas
// ---------------------------------------------------------------------------

function CurriculoSection({
  file,
  setFile,
  existingKey,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
  existingKey?: string | null;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Currículo Original</h3>
      <div className="grid grid-cols-1">
        <div className="space-y-2">
          <FieldLabel htmlFor="candidato-curriculo">
            Upload de Arquivo (PDF, DOCX, Imagens)
          </FieldLabel>
          <Input
            id="candidato-curriculo"
            type="file"
            accept=".pdf,.docx,image/png,image/jpeg"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f || null);
            }}
          />
          <FieldDescription>
            Tamanho máximo: 5MB. Ao realizar o upload, o conteúdo será
            processado pelo motor de agentes.
            {existingKey && !file && (
              <span className="block mt-2 text-primary">
                Já existe um arquivo salvo. Envie um novo para substituir.
              </span>
            )}
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}

function DadosPessoaisSection({ form }: { form: CandidatoFormApi }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Dados Pessoais</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form.AppField
          name="nome"
          validators={{ onBlur: candidatoSchema.shape.nome }}
        >
          {(field) => (
            <field.InputField
              label="Nome Completo"
              required
              autoComplete="name"
            />
          )}
        </form.AppField>

        <form.AppField
          name="nomeSocial"
          validators={{ onBlur: candidatoSchema.shape.nomeSocial }}
        >
          {(field) => <field.InputField label="Nome Social" />}
        </form.AppField>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <form.AppField
          name="dataNascimento"
          validators={{ onBlur: candidatoSchema.shape.dataNascimento }}
        >
          {(field) => (
            <field.InputField label="Data de Nascimento" required type="date" />
          )}
        </form.AppField>

        <form.AppField
          name="nacionalidade"
          validators={{ onBlur: candidatoSchema.shape.nacionalidade }}
        >
          {(field) => <field.InputField label="Nacionalidade" />}
        </form.AppField>

        <form.AppField
          name="estadoCivil"
          validators={{ onBlur: candidatoSchema.shape.estadoCivil }}
        >
          {(field) => (
            <field.SelectField
              label="Estado Civil"
              options={ESTADO_CIVIL_OPTIONS}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField
        name="pcd"
        validators={{ onBlur: candidatoSchema.shape.pcd }}
      >
        {(field) => (
          <field.InputField
            label="PCD (Especifique se houver)"
            placeholder="Ex: Deficiência visual parcial"
          />
        )}
      </form.AppField>
    </div>
  );
}

function ContatoURLsSection({ form }: { form: CandidatoFormApi }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Contato e Links</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form.AppField
          name="email"
          validators={{ onBlur: candidatoSchema.shape.email }}
        >
          {(field) => (
            <field.InputField
              label="E-mail"
              required
              type="email"
              autoComplete="email"
            />
          )}
        </form.AppField>

        <form.AppField
          name="celular"
          validators={{ onBlur: candidatoSchema.shape.celular }}
        >
          {(field) => (
            <field.InputField
              label="Celular"
              required
              autoComplete="tel"
              placeholder="(00) 00000-0000"
            />
          )}
        </form.AppField>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form.AppField
          name="linkedin"
          validators={{ onBlur: candidatoSchema.shape.linkedin }}
        >
          {(field) => (
            <field.InputField
              label="LinkedIn"
              type="url"
              placeholder="https://linkedin.com/in/..."
            />
          )}
        </form.AppField>

        <form.AppField
          name="portfolio"
          validators={{ onBlur: candidatoSchema.shape.portfolio }}
        >
          {(field) => (
            <field.InputField
              label="Portfólio / Site"
              type="url"
              placeholder="https://meusite.com"
            />
          )}
        </form.AppField>
      </div>
    </div>
  );
}

function EnderecoSection({ form }: { form: CandidatoFormApi }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Endereço</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_3fr]">
        <form.AppField
          name="cep"
          validators={{ onBlur: candidatoSchema.shape.cep }}
        >
          {(field) => (
            <field.InputField
              label="CEP"
              required
              placeholder="00000-000"
              autoComplete="postal-code"
            />
          )}
        </form.AppField>

        <form.AppField
          name="logradouro"
          validators={{ onBlur: candidatoSchema.shape.logradouro }}
        >
          {(field) => (
            <field.InputField
              label="Logradouro"
              required
              autoComplete="street-address"
            />
          )}
        </form.AppField>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <form.AppField
          name="bairro"
          validators={{ onBlur: candidatoSchema.shape.bairro }}
        >
          {(field) => (
            <field.InputField
              label="Bairro"
              required
              autoComplete="neighborhood"
            />
          )}
        </form.AppField>

        <form.AppField
          name="cidade"
          validators={{ onBlur: candidatoSchema.shape.cidade }}
        >
          {(field) => (
            <field.InputField
              label="Cidade"
              required
              autoComplete="address-level2"
            />
          )}
        </form.AppField>

        <form.AppField
          name="uf"
          validators={{ onBlur: candidatoSchema.shape.uf }}
        >
          {(field) => (
            <field.InputField
              label="UF"
              required
              autoComplete="address-level1"
              placeholder="EX"
              onChange={(e) =>
                field.handleChange(e.target.value.toUpperCase().slice(0, 2))
              }
            />
          )}
        </form.AppField>
      </div>
    </div>
  );
}

function InteressesSection({
  form,
  cargoOptions,
  departamentoOptions,
}: {
  form: CandidatoFormApi;
  cargoOptions: CargoOption[];
  departamentoOptions: DepartamentoOption[];
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Perfil e Interesses</h3>

      <form.AppField
        name="resumoProfissional"
        validators={{ onBlur: candidatoSchema.shape.resumoProfissional }}
      >
        {(field) => (
          <field.TextAreaField label="Resumo Profissional" required rows={4} />
        )}
      </form.AppField>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form.AppField
          name="cargoInteresseId"
          validators={{ onBlur: candidatoSchema.shape.cargoInteresseId }}
        >
          {(field) => (
            <field.SelectField
              label="Cargo de Interesse"
              placeholder="Nenhum específico"
              options={[
                { value: "none", label: "Nenhum específico" },
                ...cargoOptions.map((c) => ({
                  value: c.id,
                  label: `${c.titulo} (${c.departamento.nome})`,
                })),
              ]}
              value={field.state.value ?? "none"}
              onValueChange={(val: string) =>
                field.handleChange(val === "none" ? null : val)
              }
            />
          )}
        </form.AppField>

        <form.AppField
          name="areaInteresseId"
          validators={{ onBlur: candidatoSchema.shape.areaInteresseId }}
        >
          {(field) => (
            <field.SelectField
              label="Área de Interesse"
              placeholder="Nenhuma específica"
              options={[
                { value: "none", label: "Nenhuma específica" },
                ...departamentoOptions.map((d) => ({
                  value: d.id,
                  label: d.nome,
                })),
              ]}
              value={field.state.value ?? "none"}
              onValueChange={(val: string) =>
                field.handleChange(val === "none" ? null : val)
              }
            />
          )}
        </form.AppField>
      </div>

      <form.AppField
        name="origem"
        validators={{ onBlur: candidatoSchema.shape.origem }}
      >
        {(field) => (
          <field.SelectField label="Origem" required options={ORIGEM_OPTIONS} />
        )}
      </form.AppField>
    </div>
  );
}

function DisponibilidadesSection({ form }: { form: CandidatoFormApi }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Disponibilidades e Requisitos</h3>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form.AppField
          name="cnh"
          validators={{ onBlur: candidatoSchema.shape.cnh }}
        >
          {(field) => (
            <field.SelectField
              label="Categoria CNH"
              placeholder="Não informada"
              options={CNH_OPTIONS}
              value={field.state.value ?? "none"}
              onValueChange={(val: string) =>
                field.handleChange(val === "none" ? null : val)
              }
            />
          )}
        </form.AppField>

        <form.AppField
          name="disponibilidadeHorarios"
          validators={{ onBlur: candidatoSchema.shape.disponibilidadeHorarios }}
        >
          {(field) => (
            <field.InputField
              label="Disponibilidade de Horários"
              placeholder="Ex: Comercial, Manhã, Turnos"
            />
          )}
        </form.AppField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <form.AppField name="possuiVeiculo">
          {(field) => <field.CheckboxField label="Possui Veículo Próprio" />}
        </form.AppField>

        <form.AppField name="disponivelViagens">
          {(field) => <field.CheckboxField label="Disponível para Viagens" />}
        </form.AppField>

        <form.AppField name="disponivelMudanca">
          {(field) => <field.CheckboxField label="Disponível para Mudança" />}
        </form.AppField>

        <form.AppField name="inicioImediato">
          {(field) => <field.CheckboxField label="Início Imediato" />}
        </form.AppField>
      </div>

      <form.AppField name="ensinoMedioConcluido">
        {(field) => <field.CheckboxField label="Ensino Médio Concluído" />}
      </form.AppField>
    </div>
  );
}

function FormacoesSection({ form }: { form: CandidatoFormApi }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Formação Acadêmica</h3>
          <p className="text-sm text-muted-foreground">
            Cursos de graduação, pós-graduação, ensino técnico ou outras
            formações.
          </p>
        </div>
      </div>

      <form.Field name="formacoes" mode="array">
        {(field) => {
          const items: FormacaoInput[] = field.state.value || [];

          return (
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  <GraduationCap className="mb-2 size-8" />
                  <p className="font-medium">
                    Nenhuma formação acadêmica adicionada
                  </p>
                  <p className="text-xs">
                    Clique no botão abaixo para adicionar.
                  </p>
                </div>
              ) : (
                items.map((_, index) => (
                  <div
                    key={index}
                    className="relative space-y-4 rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm font-semibold text-foreground">
                        Formação #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => field.removeValue(index)}
                        aria-label={`Remover formação ${index + 1}`}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <form.AppField
                        name={`formacoes[${index}].titulo`}
                        validators={{ onBlur: formacaoBaseSchema.shape.titulo }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Curso / Título"
                            required
                            placeholder="Ex: Bacharelado em Ciência da Computação"
                          />
                        )}
                      </form.AppField>

                      <form.AppField
                        name={`formacoes[${index}].areaFormacao`}
                        validators={{
                          onBlur: formacaoBaseSchema.shape.areaFormacao,
                        }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Área de Formação"
                            required
                            placeholder="Ex: Tecnologia da Informação"
                          />
                        )}
                      </form.AppField>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <form.AppField
                        name={`formacoes[${index}].instituicao`}
                        validators={{
                          onBlur: formacaoBaseSchema.shape.instituicao,
                        }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Instituição"
                            placeholder="Ex: USP, FIAP, Senai"
                            onChange={(e) =>
                              subField.handleChange(e.target.value || null)
                            }
                          />
                        )}
                      </form.AppField>

                      <form.AppField
                        name={`formacoes[${index}].dataInicio`}
                        validators={{
                          onBlur: formacaoBaseSchema.shape.dataInicio,
                        }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Data de Início"
                            required
                            type="date"
                          />
                        )}
                      </form.AppField>

                      <form.AppField
                        name={`formacoes[${index}].dataTermino`}
                        validators={{
                          onBlur: formacaoBaseSchema.shape.dataTermino,
                        }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Data de Término"
                            type="date"
                            onChange={(e) =>
                              subField.handleChange(e.target.value || null)
                            }
                          />
                        )}
                      </form.AppField>
                    </div>
                  </div>
                ))
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  field.pushValue({
                    titulo: "",
                    instituicao: null,
                    areaFormacao: "",
                    dataInicio: "",
                    dataTermino: null,
                  })
                }
              >
                <Plus className="mr-2 size-4" />
                Adicionar Formação
              </Button>
            </div>
          );
        }}
      </form.Field>
    </div>
  );
}

function ExperienciasSection({ form }: { form: CandidatoFormApi }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Experiência Profissional</h3>
          <p className="text-sm text-muted-foreground">
            Histórico de experiências profissionais anteriores e atuais.
          </p>
        </div>
      </div>

      <form.Field name="experiencias" mode="array">
        {(field) => {
          const items: ExperienciaInput[] = field.state.value || [];

          return (
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  <Briefcase className="mb-2 size-8" />
                  <p className="font-medium">
                    Nenhuma experiência profissional adicionada
                  </p>
                  <p className="text-xs">
                    Clique no botão abaixo para adicionar.
                  </p>
                </div>
              ) : (
                items.map((_, index) => (
                  <div
                    key={index}
                    className="relative space-y-4 rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm font-semibold text-foreground">
                        Experiência #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => field.removeValue(index)}
                        aria-label={`Remover experiência ${index + 1}`}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <form.AppField
                        name={`experiencias[${index}].cargoTitulo`}
                        validators={{
                          onBlur: experienciaBaseSchema.shape.cargoTitulo,
                        }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Cargo / Função"
                            required
                            placeholder="Ex: Desenvolvedor Frontend Sênior"
                          />
                        )}
                      </form.AppField>

                      <form.AppField
                        name={`experiencias[${index}].empresa`}
                        validators={{
                          onBlur: experienciaBaseSchema.shape.empresa,
                        }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Empresa"
                            placeholder="Ex: Tech Solutions Ltda"
                            onChange={(e) =>
                              subField.handleChange(e.target.value || null)
                            }
                          />
                        )}
                      </form.AppField>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <form.AppField
                        name={`experiencias[${index}].dataEntrada`}
                        validators={{
                          onBlur: experienciaBaseSchema.shape.dataEntrada,
                        }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Data de Entrada"
                            required
                            type="date"
                          />
                        )}
                      </form.AppField>

                      <form.AppField
                        name={`experiencias[${index}].dataSaida`}
                        validators={{
                          onBlur: experienciaBaseSchema.shape.dataSaida,
                        }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Data de Saída"
                            type="date"
                            description="Deixe em branco se for a experiência ou emprego atual."
                            onChange={(e) =>
                              subField.handleChange(e.target.value || null)
                            }
                          />
                        )}
                      </form.AppField>
                    </div>

                    <form.AppField
                      name={`experiencias[${index}].descricao`}
                      validators={{
                        onBlur: experienciaBaseSchema.shape.descricao,
                      }}
                    >
                      {(subField) => (
                        <subField.TextAreaField
                          label="Descrição das Atividades"
                          rows={3}
                          placeholder="Descreva as principais responsabilidades, projetos e realizações..."
                          onChange={(e) =>
                            subField.handleChange(e.target.value || null)
                          }
                        />
                      )}
                    </form.AppField>
                  </div>
                ))
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  field.pushValue({
                    cargoTitulo: "",
                    empresa: null,
                    dataEntrada: "",
                    dataSaida: null,
                    descricao: null,
                  })
                }
              >
                <Plus className="mr-2 size-4" />
                Adicionar Experiência
              </Button>
            </div>
          );
        }}
      </form.Field>
    </div>
  );
}

function CertificacoesSection({ form }: { form: CandidatoFormApi }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Certificações</h3>
          <p className="text-sm text-muted-foreground">
            Certificados técnicos, licenças profissionais, cursos livres e
            habilitações.
          </p>
        </div>
      </div>

      <form.Field name="certificacoes" mode="array">
        {(field) => {
          const items: CertificacaoInput[] = field.state.value || [];

          return (
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  <Award className="mb-2 size-8" />
                  <p className="font-medium">Nenhuma certificação adicionada</p>
                  <p className="text-xs">
                    Clique no botão abaixo para adicionar.
                  </p>
                </div>
              ) : (
                items.map((_, index) => (
                  <div
                    key={index}
                    className="relative space-y-4 rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm font-semibold text-foreground">
                        Certificação #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => field.removeValue(index)}
                        aria-label={`Remover certificação ${index + 1}`}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="md:col-span-1">
                        <form.AppField
                          name={`certificacoes[${index}].titulo`}
                          validators={{
                            onBlur: certificacaoBaseSchema.shape.titulo,
                          }}
                        >
                          {(subField) => (
                            <subField.InputField
                              label="Título / Certificado"
                              required
                              placeholder="Ex: AWS Solutions Architect, NR10, Scrum"
                            />
                          )}
                        </form.AppField>
                      </div>

                      <form.AppField
                        name={`certificacoes[${index}].obtidaEm`}
                        validators={{
                          onBlur: certificacaoBaseSchema.shape.obtidaEm,
                        }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Data de Obtenção"
                            type="date"
                            onChange={(e) =>
                              subField.handleChange(e.target.value || null)
                            }
                          />
                        )}
                      </form.AppField>

                      <form.AppField
                        name={`certificacoes[${index}].validade`}
                        validators={{
                          onBlur: certificacaoBaseSchema.shape.validade,
                        }}
                      >
                        {(subField) => (
                          <subField.InputField
                            label="Data de Validade"
                            type="date"
                            description="Deixe em branco se a certificação não expirar."
                            onChange={(e) =>
                              subField.handleChange(e.target.value || null)
                            }
                          />
                        )}
                      </form.AppField>
                    </div>
                  </div>
                ))
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  field.pushValue({
                    titulo: "",
                    obtidaEm: null,
                    validade: null,
                  })
                }
              >
                <Plus className="mr-2 size-4" />
                Adicionar Certificação
              </Button>
            </div>
          );
        }}
      </form.Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulário Principal
// ---------------------------------------------------------------------------

export function CandidatoBaseForm({
  candidato,
  departamentoOptions,
  cargoOptions,
  onSuccess,
  onCancel,
  redirectTo,
  className,
}: CandidatoBaseFormProps) {
  const router = useRouter();
  const isEdit = Boolean(candidato?.id);

  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const form = useAppForm({
    defaultValues: {
      nome: candidato?.nome ?? "",
      nomeSocial: candidato?.nomeSocial ?? "",
      nacionalidade: candidato?.nacionalidade ?? "brasileira",
      dataNascimento: candidato?.dataNascimento ?? "",
      estadoCivil: candidato?.estadoCivil ?? "nao_informado",
      pcd: candidato?.pcd ?? "",
      email: candidato?.email ?? "",
      celular: candidato?.celular ?? "",
      cep: candidato?.cep ?? "",
      uf: candidato?.uf ?? "",
      cidade: candidato?.cidade ?? "",
      bairro: candidato?.bairro ?? "",
      logradouro: candidato?.logradouro ?? "",
      resumoProfissional: candidato?.resumoProfissional ?? "",
      cnh: candidato?.cnh ?? null,
      possuiVeiculo: candidato?.possuiVeiculo ?? false,
      ensinoMedioConcluido: candidato?.ensinoMedioConcluido ?? false,
      cargoInteresseId: candidato?.cargoInteresseId ?? null,
      areaInteresseId: candidato?.areaInteresseId ?? null,
      disponivelViagens: candidato?.disponivelViagens ?? false,
      disponivelMudanca: candidato?.disponivelMudanca ?? false,
      disponibilidadeHorarios: candidato?.disponibilidadeHorarios ?? "",
      inicioImediato: candidato?.inicioImediato ?? false,
      linkedin: candidato?.linkedin ?? "",
      portfolio: candidato?.portfolio ?? "",
      origem: candidato?.origem ?? "manual",
      formacoes: candidato?.formacoes ?? [],
      experiencias: candidato?.experiencias ?? [],
      certificacoes: candidato?.certificacoes ?? [],
    } as CandidatoAgregadoInput,
    validators: {
      onBlur: candidatoAgregadoSchema,
    },
    onSubmit: (props) => {
      console.log(props.formApi.getAllErrors());

      const formData = new FormData();
      formData.append("data", JSON.stringify(props.value));
      if (resumeFile) {
        formData.append("file", resumeFile);
      }

      const req =
        isEdit && candidato?.id
          ? updateCandidato(candidato.id, formData)
          : createCandidato(formData);

      toastActionPromise(req, {
        loading: isEdit
          ? "Atualizando candidato..."
          : "Cadastrando candidato...",
        success: isEdit
          ? "Candidato atualizado com sucesso!"
          : "Candidato cadastrado com sucesso!",
        onSuccess: ({ data }) => {
          if (onSuccess) onSuccess(data!);
          else if (redirectTo) router.push(redirectTo);
          else router.push("/candidatos");
        },
      });
    },
  });

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{isEdit ? "Editar Candidato" : "Novo Candidato"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Atualize as informações de contato e perfil do candidato."
            : "Cadastre as informações básicas de um novo candidato."}
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
          <FieldGroup className="space-y-4">
            <DadosPessoaisSection form={form} />
            <ContatoURLsSection form={form} />
            <EnderecoSection form={form} />
            <InteressesSection
              form={form}
              cargoOptions={cargoOptions}
              departamentoOptions={departamentoOptions}
            />
            <CurriculoSection
              file={resumeFile}
              setFile={setResumeFile}
              existingKey={candidato?.curriculoArquivoKey}
            />
            <DisponibilidadesSection form={form} />
            <FormacoesSection form={form} />
            <ExperienciasSection form={form} />
            <CertificacoesSection form={form} />
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <form.AppForm>
            <form.SaveButton
              label={isEdit ? "Salvar Alterações" : "Cadastrar Candidato"}
            />
          </form.AppForm>
        </CardFooter>
      </form>
    </Card>
  );
}
