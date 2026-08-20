import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Code,
  Users,
  UserCheck,
  CheckCircle,
  Briefcase,
  MapPin,
  Pencil,
  BrainCircuit,
  PlusCircle,
  AlertTriangle,
  MinusCircle,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";

import { triagemRepository } from "~/server/db/repositories/triagem";
import { PageHeader } from "~/components/page-header";
import { StatusBadge } from "~/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button, buttonVariants } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { getWhatsAppUrl } from "~/lib/whatsapp";

const ETAPAS = [
  { value: "curriculo", label: "Currículo", Icon: FileText },
  { value: "testes", label: "Testes", Icon: Code },
  { value: "entrevista_rh", label: "Entrevista RH", Icon: Users },
  { value: "entrevista_gestor", label: "Entrevista Gestor", Icon: UserCheck },
  { value: "finalizado", label: "Finalizado", Icon: CheckCircle },
] as const;

export default async function TriagemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const triagem = await triagemRepository.findByIdWithJoins(id);

  if (!triagem) {
    notFound();
  }

  const currentEtapaIndex = ETAPAS.findIndex((e) => e.value === triagem.etapa);

  return (
    <div className="flex flex-col gap-6 p-6 mx-auto max-w-7xl">
      <PageHeader
        title={triagem.candidato.nome}
        description={
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
              <Briefcase className="h-4 w-4" />
              <span>
                {triagem.vaga.cargo.titulo} • {triagem.vaga.cargo.departamento.nome}
              </span>
              <span className="hidden sm:inline mx-1">•</span>
              <MapPin className="h-4 w-4 hidden sm:block" />
              <span>
                {triagem.vaga.cidade} - {triagem.vaga.uf}
              </span>
            </div>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={triagem.resultado} />
            {triagem.motivo && (
              <Badge variant="outline" className="text-muted-foreground capitalize">
                Motivo: {triagem.motivo.replace(/_/g, " ")}
              </Badge>
            )}
            <Link href={`/triagens/${triagem.id}/editar`} className={buttonVariants({ variant: "outline" })}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar Triagem
            </Link>
          </div>
        }
      />

      {/* Stepper */}
      <Card>
        <CardContent className="p-6">
          <div className="relative flex justify-between">
            <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 rounded-full bg-muted" />
            <div
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-primary transition-all"
              style={{
                width: `${Math.max(
                  0,
                  (currentEtapaIndex / (ETAPAS.length - 1)) * 100,
                )}%`,
              }}
            />
            {ETAPAS.map((etapa, idx) => {
              const isActive = idx === currentEtapaIndex;
              const isPast = idx < currentEtapaIndex;
              const { Icon } = etapa;

              return (
                <div
                  key={etapa.value}
                  className="relative z-10 flex flex-col items-center gap-2"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-background transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground scale-110 shadow-md"
                        : isPast
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      isActive
                        ? "text-primary"
                        : isPast
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {etapa.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Parecer RH */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pencil className="h-5 w-5 text-primary" />
                Parecer do RH
              </CardTitle>
              {triagem.parecerRhData && (
                <span className="text-xs font-mono text-muted-foreground">
                  {new Date(triagem.parecerRhData).toLocaleDateString("pt-BR")}
                </span>
              )}
            </CardHeader>
            <CardContent>
              {triagem.parecerRh ? (
                <div className="rounded-lg bg-muted/50 p-4 text-sm text-foreground whitespace-pre-wrap">
                  {triagem.parecerRh}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Sem parecer registrado.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Candidato Info Rápid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contato Rápido</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {triagem.candidato.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {triagem.candidato.celular}
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`mailto:${triagem.candidato.email}`} className={buttonVariants({ variant: "secondary", className: "flex-1" })}>
                  <Mail className="mr-2 h-4 w-4" /> Email
                </a>
                <a
                  href={getWhatsAppUrl(triagem.candidato.celular)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "secondary", className: "flex-1" })}
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </div>
              <Link href={`/candidatos/${triagem.candidato.id}`} className={buttonVariants({ variant: "outline", className: "w-full" })}>
                Ver Perfil Completo
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          {/* Avaliação de IA */}
          <Card className="h-full relative overflow-hidden">
            <div className="absolute right-0 top-0 p-6 opacity-[0.03] pointer-events-none">
              <BrainCircuit className="h-32 w-32" />
            </div>
            <CardHeader className="relative z-10 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg text-primary">
                  <BrainCircuit className="h-5 w-5" />
                  Avaliação de IA WGO
                </CardTitle>
                {triagem.avaliacao_ia?.vagaFoiInferida && (
                  <span className="mt-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Vaga inferida automaticamente
                  </span>
                )}
              </div>
              {triagem.avaliacao_ia && (
                <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-3">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-primary">
                      {Number(triagem.avaliacao_ia.scoreIa).toFixed(0)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Score Global
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="relative z-10">
              {triagem.avaliacao_ia ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold flex items-center gap-2 text-foreground">
                      Parecer Analítico
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {triagem.avaliacao_ia.parecerIa}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border-l-4 border-emerald-500 bg-muted/30 p-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                        <PlusCircle className="h-4 w-4 text-emerald-500" />
                        Pontos Fortes
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {triagem.avaliacao_ia.pontosFortes}
                      </p>
                    </div>

                    <div className="rounded-lg border-l-4 border-amber-500 bg-muted/30 p-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Alertas
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {triagem.avaliacao_ia.alertas}
                      </p>
                    </div>

                    <div className="rounded-lg border-l-4 border-slate-400 bg-muted/30 p-4 md:col-span-2">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                        <MinusCircle className="h-4 w-4 text-slate-400" />
                        Requisitos Faltantes
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {triagem.avaliacao_ia.requisitosFaltantes}
                      </p>
                    </div>
                    
                    {triagem.avaliacao_ia.eliminatoriosFalhos && triagem.avaliacao_ia.eliminatoriosFalhos.trim() !== "" && (
                      <div className="rounded-lg border-l-4 border-destructive bg-destructive/5 p-4 md:col-span-2">
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          Eliminatórios Falhos
                        </h4>
                        <p className="text-sm text-destructive whitespace-pre-wrap">
                          {triagem.avaliacao_ia.eliminatoriosFalhos}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <BrainCircuit className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Nenhuma avaliação de IA disponível para esta triagem.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
