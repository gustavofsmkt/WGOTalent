"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type ReactFormExtendedApi } from "@tanstack/react-form";
import type { z } from "zod";
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
} from "~/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Plus, Trash2, GraduationCap, Briefcase, Award } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FormSubmitButton } from "~/components/form-submit-button";
import { ErrorCallout } from "~/components/error-callout";
import { cn } from "~/lib/utils";
import { createCandidato, updateCandidato } from "~/actions/candidatos";

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
  existingKey
}: { 
  file: File | null; 
  setFile: (file: File | null) => void;
  existingKey?: string | null;
}) {
  return (
    <div className="space-y-6">
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
            Tamanho máximo: 5MB. Ao realizar o upload, o conteúdo será processado pelo motor de agentes.
            {existingKey && !file && (
              <span className="block mt-1 text-primary">
                Já existe um arquivo salvo. Envie um novo para substituir.
              </span>
            )}
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}

function DadosPessoaisSection({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Dados Pessoais</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form.Field name="nome" validators={{ onBlur: candidatoSchema.shape.nome }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-nome">Nome Completo *</FieldLabel>
                <Input
                  id="candidato-nome"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={hasErrors}
                  autoComplete="name"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="nomeSocial" validators={{ onBlur: candidatoSchema.shape.nomeSocial }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-nome-social">Nome Social</FieldLabel>
                <Input
                  id="candidato-nome-social"
                  value={field.state.value || ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={hasErrors}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <form.Field name="dataNascimento" validators={{ onBlur: candidatoSchema.shape.dataNascimento }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-data-nascimento">Data de Nascimento *</FieldLabel>
                <Input
                  id="candidato-data-nascimento"
                  type="date"
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

        <form.Field name="nacionalidade" validators={{ onBlur: candidatoSchema.shape.nacionalidade }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-nacionalidade">Nacionalidade</FieldLabel>
                <Input
                  id="candidato-nacionalidade"
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

        <form.Field name="estadoCivil" validators={{ onBlur: candidatoSchema.shape.estadoCivil }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-estado-civil">Estado Civil</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(val: any) => field.handleChange(val)}
                >
                  <SelectTrigger id="candidato-estado-civil" aria-invalid={hasErrors}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao_informado">Não Informado</SelectItem>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União Estável</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>
      </div>

      <form.Field name="pcd" validators={{ onBlur: candidatoSchema.shape.pcd }}>
        {(field: any) => {
          const hasErrors = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={hasErrors}>
              <FieldLabel htmlFor="candidato-pcd">PCD (Especifique se houver)</FieldLabel>
              <Input
                id="candidato-pcd"
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={hasErrors}
                placeholder="Ex: Deficiência visual parcial"
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      </form.Field>
    </div>
  );
}

function ContatoURLsSection({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Contato e Links</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form.Field name="email" validators={{ onBlur: candidatoSchema.shape.email }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-email">E-mail *</FieldLabel>
                <Input
                  id="candidato-email"
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={hasErrors}
                  autoComplete="email"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="celular" validators={{ onBlur: candidatoSchema.shape.celular }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-celular">Celular *</FieldLabel>
                <Input
                  id="candidato-celular"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={hasErrors}
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form.Field name="linkedin" validators={{ onBlur: candidatoSchema.shape.linkedin }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-linkedin">LinkedIn</FieldLabel>
                <Input
                  id="candidato-linkedin"
                  type="url"
                  value={field.state.value || ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={hasErrors}
                  placeholder="https://linkedin.com/in/..."
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="portfolio" validators={{ onBlur: candidatoSchema.shape.portfolio }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-portfolio">Portfólio / Site</FieldLabel>
                <Input
                  id="candidato-portfolio"
                  type="url"
                  value={field.state.value || ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={hasErrors}
                  placeholder="https://meusite.com"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>
      </div>
    </div>
  );
}

function EnderecoSection({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Endereço</h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_3fr]">
        <form.Field name="cep" validators={{ onBlur: candidatoSchema.shape.cep }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-cep">CEP *</FieldLabel>
                <Input
                  id="candidato-cep"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={hasErrors}
                  placeholder="00000-000"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="logradouro" validators={{ onBlur: candidatoSchema.shape.logradouro }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-logradouro">Logradouro *</FieldLabel>
                <Input
                  id="candidato-logradouro"
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
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <form.Field name="bairro" validators={{ onBlur: candidatoSchema.shape.bairro }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-bairro">Bairro *</FieldLabel>
                <Input
                  id="candidato-bairro"
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

        <form.Field name="cidade" validators={{ onBlur: candidatoSchema.shape.cidade }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-cidade">Cidade *</FieldLabel>
                <Input
                  id="candidato-cidade"
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

        <form.Field name="uf" validators={{ onBlur: candidatoSchema.shape.uf }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-uf">UF *</FieldLabel>
                <Input
                  id="candidato-uf"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase().slice(0, 2))}
                  aria-invalid={hasErrors}
                  placeholder="EX"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>
      </div>
    </div>
  );
}

function InteressesSection({ 
  form, 
  cargoOptions, 
  departamentoOptions 
}: { 
  form: any,
  cargoOptions: CargoOption[],
  departamentoOptions: DepartamentoOption[]
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Perfil e Interesses</h3>
      
      <form.Field name="resumoProfissional" validators={{ onBlur: candidatoSchema.shape.resumoProfissional }}>
        {(field: any) => {
          const hasErrors = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={hasErrors}>
              <FieldLabel htmlFor="candidato-resumo">Resumo Profissional *</FieldLabel>
              <Textarea
                id="candidato-resumo"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={hasErrors}
                rows={4}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      </form.Field>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form.Field name="cargoInteresseId" validators={{ onBlur: candidatoSchema.shape.cargoInteresseId }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-cargo-interesse">Cargo de Interesse</FieldLabel>
                <Select
                  value={field.state.value || "none"}
                  onValueChange={(val) => field.handleChange(val === "none" ? null : val)}
                >
                  <SelectTrigger id="candidato-cargo-interesse" aria-invalid={hasErrors}>
                    <SelectValue placeholder="Selecione um cargo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum específico</SelectItem>
                    {cargoOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.titulo} ({c.departamento.nome})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="areaInteresseId" validators={{ onBlur: candidatoSchema.shape.areaInteresseId }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-area-interesse">Área de Interesse</FieldLabel>
                <Select
                  value={field.state.value || "none"}
                  onValueChange={(val) => field.handleChange(val === "none" ? null : val)}
                >
                  <SelectTrigger id="candidato-area-interesse" aria-invalid={hasErrors}>
                    <SelectValue placeholder="Selecione uma área..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma específica</SelectItem>
                    {departamentoOptions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>
      </div>

      <form.Field name="origem" validators={{ onBlur: candidatoSchema.shape.origem }}>
        {(field: any) => {
          const hasErrors = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={hasErrors}>
              <FieldLabel htmlFor="candidato-origem">Origem *</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(val: any) => field.handleChange(val)}
              >
                <SelectTrigger id="candidato-origem" aria-invalid={hasErrors}>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="manual">Cadastro Manual</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      </form.Field>
    </div>
  );
}

function DisponibilidadesSection({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Disponibilidades e Requisitos</h3>
      
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form.Field name="cnh" validators={{ onBlur: candidatoSchema.shape.cnh }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-cnh">Categoria CNH</FieldLabel>
                <Select
                  value={field.state.value || "none"}
                  onValueChange={(val: any) => field.handleChange(val === "none" ? null : val)}
                >
                  <SelectTrigger id="candidato-cnh" aria-invalid={hasErrors}>
                    <SelectValue placeholder="Não possui ou não informada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não informada</SelectItem>
                    <SelectItem value="a">A (Moto)</SelectItem>
                    <SelectItem value="b">B (Carro)</SelectItem>
                    <SelectItem value="ab">AB (Moto e Carro)</SelectItem>
                    <SelectItem value="c">C (Caminhão)</SelectItem>
                    <SelectItem value="d">D (Ônibus)</SelectItem>
                    <SelectItem value="e">E (Carreta)</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="disponibilidadeHorarios" validators={{ onBlur: candidatoSchema.shape.disponibilidadeHorarios }}>
          {(field: any) => {
            const hasErrors = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={hasErrors}>
                <FieldLabel htmlFor="candidato-disponibilidade-horarios">Disponibilidade de Horários</FieldLabel>
                <Input
                  id="candidato-disponibilidade-horarios"
                  value={field.state.value || ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={hasErrors}
                  placeholder="Ex: Comercial, Manhã, Turnos"
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            );
          }}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <form.Field name="possuiVeiculo">
          {(field: any) => (
            <Field className="flex flex-row items-start space-x-3 space-y-0 p-2">
              <Checkbox
                id="candidato-possui-veiculo"
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked === true)}
                onBlur={field.handleBlur}
              />
              <div className="space-y-1 leading-none">
                <FieldLabel htmlFor="candidato-possui-veiculo">Possui Veículo Próprio</FieldLabel>
              </div>
            </Field>
          )}
        </form.Field>

        <form.Field name="disponivelViagens">
          {(field: any) => (
            <Field className="flex flex-row items-start space-x-3 space-y-0 p-2">
              <Checkbox
                id="candidato-disponivel-viagens"
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked === true)}
                onBlur={field.handleBlur}
              />
              <div className="space-y-1 leading-none">
                <FieldLabel htmlFor="candidato-disponivel-viagens">Disponível para Viagens</FieldLabel>
              </div>
            </Field>
          )}
        </form.Field>

        <form.Field name="disponivelMudanca">
          {(field: any) => (
            <Field className="flex flex-row items-start space-x-3 space-y-0 p-2">
              <Checkbox
                id="candidato-disponivel-mudanca"
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked === true)}
                onBlur={field.handleBlur}
              />
              <div className="space-y-1 leading-none">
                <FieldLabel htmlFor="candidato-disponivel-mudanca">Disponível para Mudança</FieldLabel>
              </div>
            </Field>
          )}
        </form.Field>

        <form.Field name="inicioImediato">
          {(field: any) => (
            <Field className="flex flex-row items-start space-x-3 space-y-0 p-2">
              <Checkbox
                id="candidato-inicio-imediato"
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked === true)}
                onBlur={field.handleBlur}
              />
              <div className="space-y-1 leading-none">
                <FieldLabel htmlFor="candidato-inicio-imediato">Início Imediato</FieldLabel>
              </div>
            </Field>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1">
        <form.Field name="ensinoMedioConcluido">
          {(field: any) => (
            <Field className="flex flex-row items-start space-x-3 space-y-0 p-2">
              <Checkbox
                id="candidato-ensino-medio"
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked === true)}
                onBlur={field.handleBlur}
              />
              <div className="space-y-1 leading-none">
                <FieldLabel htmlFor="candidato-ensino-medio">Ensino Médio Concluído</FieldLabel>
              </div>
            </Field>
          )}
        </form.Field>
      </div>
    </div>
  );
}

function FormacoesSection({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Formação Acadêmica</h3>
          <p className="text-sm text-muted-foreground">
            Cursos de graduação, pós-graduação, ensino técnico ou outras formações.
          </p>
        </div>
      </div>

      <form.Field name="formacoes" mode="array">
        {(field: any) => {
          const items: FormacaoInput[] = field.state.value || [];

          return (
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <GraduationCap className="mb-2 size-8 text-muted-foreground/60" />
                  <p className="font-medium">Nenhuma formação acadêmica adicionada</p>
                  <p className="text-xs">Clique no botão abaixo para adicionar.</p>
                </div>
              ) : (
                items.map((_, index) => (
                  <div
                    key={index}
                    className="relative space-y-4 rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b pb-3">
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
                        <Trash2 className="mr-1 size-4" />
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <form.Field
                        name={`formacoes[${index}].titulo`}
                        validators={{ onBlur: formacaoBaseSchema.shape.titulo }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`formacao-titulo-${index}`}>
                                Curso / Título *
                              </FieldLabel>
                              <Input
                                id={`formacao-titulo-${index}`}
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) => subField.handleChange(e.target.value)}
                                aria-invalid={hasErrors}
                                placeholder="Ex: Bacharelado em Ciência da Computação"
                              />
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>

                      <form.Field
                        name={`formacoes[${index}].areaFormacao`}
                        validators={{ onBlur: formacaoBaseSchema.shape.areaFormacao }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`formacao-area-${index}`}>
                                Área de Formação *
                              </FieldLabel>
                              <Input
                                id={`formacao-area-${index}`}
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) => subField.handleChange(e.target.value)}
                                aria-invalid={hasErrors}
                                placeholder="Ex: Tecnologia da Informação"
                              />
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <form.Field
                        name={`formacoes[${index}].instituicao`}
                        validators={{ onBlur: formacaoBaseSchema.shape.instituicao }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`formacao-instituicao-${index}`}>
                                Instituição
                              </FieldLabel>
                              <Input
                                id={`formacao-instituicao-${index}`}
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value ? e.target.value : null)
                                }
                                aria-invalid={hasErrors}
                                placeholder="Ex: USP, FIAP, Senai"
                              />
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>

                      <form.Field
                        name={`formacoes[${index}].dataInicio`}
                        validators={{ onBlur: formacaoBaseSchema.shape.dataInicio }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`formacao-data-inicio-${index}`}>
                                Data de Início *
                              </FieldLabel>
                              <Input
                                id={`formacao-data-inicio-${index}`}
                                type="date"
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) => subField.handleChange(e.target.value)}
                                aria-invalid={hasErrors}
                              />
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>

                      <form.Field
                        name={`formacoes[${index}].dataTermino`}
                        validators={{ onBlur: formacaoBaseSchema.shape.dataTermino }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`formacao-data-termino-${index}`}>
                                Data de Término
                              </FieldLabel>
                              <Input
                                id={`formacao-data-termino-${index}`}
                                type="date"
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value ? e.target.value : null)
                                }
                                aria-invalid={hasErrors}
                              />
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>
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
                <Plus className="mr-1.5 size-4" />
                Adicionar Formação
              </Button>
            </div>
          );
        }}
      </form.Field>
    </div>
  );
}

function ExperienciasSection({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Experiência Profissional</h3>
          <p className="text-sm text-muted-foreground">
            Histórico de experiências profissionais anteriores e atuais.
          </p>
        </div>
      </div>

      <form.Field name="experiencias" mode="array">
        {(field: any) => {
          const items: ExperienciaInput[] = field.state.value || [];

          return (
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <Briefcase className="mb-2 size-8 text-muted-foreground/60" />
                  <p className="font-medium">Nenhuma experiência profissional adicionada</p>
                  <p className="text-xs">Clique no botão abaixo para adicionar.</p>
                </div>
              ) : (
                items.map((_, index) => (
                  <div
                    key={index}
                    className="relative space-y-4 rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b pb-3">
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
                        <Trash2 className="mr-1 size-4" />
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <form.Field
                        name={`experiencias[${index}].cargoTitulo`}
                        validators={{ onBlur: experienciaBaseSchema.shape.cargoTitulo }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`experiencia-cargo-${index}`}>
                                Cargo / Função *
                              </FieldLabel>
                              <Input
                                id={`experiencia-cargo-${index}`}
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) => subField.handleChange(e.target.value)}
                                aria-invalid={hasErrors}
                                placeholder="Ex: Desenvolvedor Frontend Sênior"
                              />
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>

                      <form.Field
                        name={`experiencias[${index}].empresa`}
                        validators={{ onBlur: experienciaBaseSchema.shape.empresa }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`experiencia-empresa-${index}`}>
                                Empresa
                              </FieldLabel>
                              <Input
                                id={`experiencia-empresa-${index}`}
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value ? e.target.value : null)
                                }
                                aria-invalid={hasErrors}
                                placeholder="Ex: Tech Solutions Ltda"
                              />
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <form.Field
                        name={`experiencias[${index}].dataEntrada`}
                        validators={{ onBlur: experienciaBaseSchema.shape.dataEntrada }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`experiencia-data-entrada-${index}`}>
                                Data de Entrada *
                              </FieldLabel>
                              <Input
                                id={`experiencia-data-entrada-${index}`}
                                type="date"
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) => subField.handleChange(e.target.value)}
                                aria-invalid={hasErrors}
                              />
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>

                      <form.Field
                        name={`experiencias[${index}].dataSaida`}
                        validators={{ onBlur: experienciaBaseSchema.shape.dataSaida }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`experiencia-data-saida-${index}`}>
                                Data de Saída
                              </FieldLabel>
                              <Input
                                id={`experiencia-data-saida-${index}`}
                                type="date"
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value ? e.target.value : null)
                                }
                                aria-invalid={hasErrors}
                              />
                              <FieldDescription>
                                Deixe em branco se for a experiência ou emprego atual.
                              </FieldDescription>
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>

                    <form.Field
                      name={`experiencias[${index}].descricao`}
                      validators={{ onBlur: experienciaBaseSchema.shape.descricao }}
                    >
                      {(subField: any) => {
                        const hasErrors = subField.state.meta.errors.length > 0;
                        return (
                          <Field data-invalid={hasErrors}>
                            <FieldLabel htmlFor={`experiencia-descricao-${index}`}>
                              Descrição das Atividades
                            </FieldLabel>
                            <Textarea
                              id={`experiencia-descricao-${index}`}
                              value={subField.state.value || ""}
                              onBlur={subField.handleBlur}
                              onChange={(e) =>
                                subField.handleChange(e.target.value ? e.target.value : null)
                              }
                              aria-invalid={hasErrors}
                              rows={3}
                              placeholder="Descreva as principais responsabilidades, projetos e realizações..."
                            />
                            <FieldError errors={subField.state.meta.errors} />
                          </Field>
                        );
                      }}
                    </form.Field>
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
                <Plus className="mr-1.5 size-4" />
                Adicionar Experiência
              </Button>
            </div>
          );
        }}
      </form.Field>
    </div>
  );
}

function CertificacoesSection({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Certificações</h3>
          <p className="text-sm text-muted-foreground">
            Certificados técnicos, licenças profissionais, cursos livres e habilitações.
          </p>
        </div>
      </div>

      <form.Field name="certificacoes" mode="array">
        {(field: any) => {
          const items: CertificacaoInput[] = field.state.value || [];

          return (
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <Award className="mb-2 size-8 text-muted-foreground/60" />
                  <p className="font-medium">Nenhuma certificação adicionada</p>
                  <p className="text-xs">Clique no botão abaixo para adicionar.</p>
                </div>
              ) : (
                items.map((_, index) => (
                  <div
                    key={index}
                    className="relative space-y-4 rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b pb-3">
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
                        <Trash2 className="mr-1 size-4" />
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="md:col-span-1">
                        <form.Field
                          name={`certificacoes[${index}].titulo`}
                          validators={{ onBlur: certificacaoBaseSchema.shape.titulo }}
                        >
                          {(subField: any) => {
                            const hasErrors = subField.state.meta.errors.length > 0;
                            return (
                              <Field data-invalid={hasErrors}>
                                <FieldLabel htmlFor={`certificacao-titulo-${index}`}>
                                  Título / Certificado *
                                </FieldLabel>
                                <Input
                                  id={`certificacao-titulo-${index}`}
                                  value={subField.state.value || ""}
                                  onBlur={subField.handleBlur}
                                  onChange={(e) => subField.handleChange(e.target.value)}
                                  aria-invalid={hasErrors}
                                  placeholder="Ex: AWS Solutions Architect, NR10, Scrum"
                                />
                                <FieldError errors={subField.state.meta.errors} />
                              </Field>
                            );
                          }}
                        </form.Field>
                      </div>

                      <form.Field
                        name={`certificacoes[${index}].obtidaEm`}
                        validators={{ onBlur: certificacaoBaseSchema.shape.obtidaEm }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`certificacao-obtida-em-${index}`}>
                                Data de Obtenção
                              </FieldLabel>
                              <Input
                                id={`certificacao-obtida-em-${index}`}
                                type="date"
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value ? e.target.value : null)
                                }
                                aria-invalid={hasErrors}
                              />
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>

                      <form.Field
                        name={`certificacoes[${index}].validade`}
                        validators={{ onBlur: certificacaoBaseSchema.shape.validade }}
                      >
                        {(subField: any) => {
                          const hasErrors = subField.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={hasErrors}>
                              <FieldLabel htmlFor={`certificacao-validade-${index}`}>
                                Data de Validade
                              </FieldLabel>
                              <Input
                                id={`certificacao-validade-${index}`}
                                type="date"
                                value={subField.state.value || ""}
                                onBlur={subField.handleBlur}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value ? e.target.value : null)
                                }
                                aria-invalid={hasErrors}
                              />
                              <FieldDescription>
                                Deixe em branco se a certificação não expirar.
                              </FieldDescription>
                              <FieldError errors={subField.state.meta.errors} />
                            </Field>
                          );
                        }}
                      </form.Field>
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
                <Plus className="mr-1.5 size-4" />
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
  const [serverError, setServerError] = React.useState<{
    message?: string;
    fieldErrors?: Record<string, string[]>;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      nome: candidato?.nome ?? "",
      nomeSocial: candidato?.nomeSocial ?? null,
      nacionalidade: candidato?.nacionalidade ?? "brasileira",
      dataNascimento: candidato?.dataNascimento ?? "",
      estadoCivil: candidato?.estadoCivil ?? "nao_informado",
      pcd: candidato?.pcd ?? null,
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
      disponibilidadeHorarios: candidato?.disponibilidadeHorarios ?? null,
      inicioImediato: candidato?.inicioImediato ?? false,
      linkedin: candidato?.linkedin ?? null,
      portfolio: candidato?.portfolio ?? null,
      origem: candidato?.origem ?? "manual",
      formacoes: candidato?.formacoes ?? [],
      experiencias: candidato?.experiencias ?? [],
      certificacoes: candidato?.certificacoes ?? [],
    } as CandidatoAgregadoInput,
    validators: {
      onBlur: candidatoAgregadoSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const formData = new FormData();
      formData.append("data", JSON.stringify(value));
      if (resumeFile) {
        formData.append("file", resumeFile);
      }

      const result =
        isEdit && candidato?.id
          ? await updateCandidato(candidato.id, formData)
          : await createCandidato(formData);

      if (!result.success) {
        setServerError({
          message: result.message ?? "Ocorreu um erro ao salvar o candidato.",
          fieldErrors: result.errors,
        });
        return;
      }

      if (result.data) {
        if (onSuccess) {
          onSuccess(result.data);
        } else if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push("/candidatos");
        }
      }
    },
  });

  const serverErrorList = serverError?.fieldErrors
    ? Object.values(serverError.fieldErrors).flat()
    : [];

  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)}>
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
      >
        <CardContent className="space-y-10">
          {serverError && (
            <ErrorCallout
              title="Não foi possível salvar o candidato"
              message={serverError.message}
              errors={serverErrorList.length > 0 ? serverErrorList : undefined}
            />
          )}

          <FieldGroup className="space-y-10">
            <DadosPessoaisSection form={form} />
            <ContatoURLsSection form={form} />
            <EnderecoSection form={form} />
            <InteressesSection form={form} cargoOptions={cargoOptions} departamentoOptions={departamentoOptions} />
            <CurriculoSection file={resumeFile} setFile={setResumeFile} existingKey={candidato?.curriculoArquivoKey} />
            <DisponibilidadesSection form={form} />
            <FormacoesSection form={form} />
            <ExperienciasSection form={form} />
            <CertificacoesSection form={form} />
          </FieldGroup>
        </CardContent>

        <div className="px-6 py-4 bg-muted/50 border-t rounded-b-xl flex justify-end gap-3">
          {onCancel && (
            <FormSubmitButton
              type="button"
              variant="outline"
              onClick={onCancel}
              pending={false}
            >
              Cancelar
            </FormSubmitButton>
          )}
          <form.Subscribe
            selector={(state: any) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]: any) => (
              <FormSubmitButton
                type="submit"
                disabled={!canSubmit}
                pending={isSubmitting}
              >
                {isEdit ? "Salvar Alterações" : "Cadastrar Candidato"}
              </FormSubmitButton>
            )}
          </form.Subscribe>
        </div>
      </form>
    </Card>
  );
}
