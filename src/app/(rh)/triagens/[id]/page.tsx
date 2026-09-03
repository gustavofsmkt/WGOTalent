import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  BrainCircuit,
  PlusCircle,
  AlertTriangle,
  MinusCircle,
} from "lucide-react";

import { triagemRepository } from "~/server/db/repositories/triagem";
import { uuidSchema } from "~/lib/validation/common";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getWhatsAppUrl } from "~/lib/whatsapp";
import { TriagemDetailEditor } from "./_components/triagem-detail-editor";
import { CandidatoObservacoesCard } from "./_components/candidato-observacoes-card";

export const dynamic = "force-dynamic";

export default async function TriagemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) {
    notFound();
  }

  const triagem = await triagemRepository.findByIdWithJoins(id);

  if (!triagem) {
    notFound();
  }

  const editorData = {
    id: triagem.id,
    etapa: triagem.etapa,
    resultado: triagem.resultado,
    motivo: triagem.motivo,
    parecerRhCurriculo: triagem.parecerRhCurriculo,
    parecerRhTestes: triagem.parecerRhTestes,
    parecerRhEntrevistaRh: triagem.parecerRhEntrevistaRh,
    parecerRhEntrevistaGestor: triagem.parecerRhEntrevistaGestor,
    parecerRhFinalizado: triagem.parecerRhFinalizado,
    candidato: { nome: triagem.candidato.nome },
    vaga: {
      cargo: {
        titulo: triagem.vaga.cargo.titulo,
        departamento: { nome: triagem.vaga.cargo.departamento.nome },
      },
      cidades: triagem.vaga.cidades,
    },
  };

  return (
    <div className="p-4 sm:p-4 lg:p-4 max-w-7xl mx-auto w-full space-y-4">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2">
        <Link
          href="/triagens"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-4 mr-2" />
          Voltar para Triagens
        </Link>
      </div>

      {/* Interactive editor: PageHeader + Tabs */}
      <TriagemDetailEditor
        triagem={editorData}
        key={String(triagem.updatedAt)}
      />

      {/* Static info grid — rendered as RSC, not serialized to client */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Contato Rápido */}
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
                <a
                  href={`mailto:${triagem.candidato.email}`}
                  className={buttonVariants({
                    variant: "secondary",
                    className: "flex-1",
                  })}
                >
                  <Mail className="mr-2 h-4 w-4" /> Email
                </a>
                <a
                  href={getWhatsAppUrl(triagem.candidato.celular)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "secondary",
                    className: "flex-1",
                  })}
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </div>
              <Link
                href={`/candidatos/${triagem.candidato.id}`}
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
              >
                Ver Perfil Completo
              </Link>
            </CardContent>
          </Card>

          {/* Observações do RH */}
          <CandidatoObservacoesCard
            candidatoId={triagem.candidato.id}
            initialValue={triagem.candidato.observacoesRh}
          />
        </div>

        <div className="lg:col-span-7">
          {/* Avaliação de IA */}
          <Card className="h-full relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-[0.03] pointer-events-none">
              <BrainCircuit className="h-32 w-32" />
            </div>
            <CardHeader className="relative z-10 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg text-primary">
                  <BrainCircuit className="h-5 w-5" />
                  Avaliação de IA WGO
                </CardTitle>
                {triagem.avaliacao_ia?.vagaFoiInferida && (
                  <span className="mt-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-2 text-xs font-medium text-primary">
                    Vaga inferida automaticamente
                  </span>
                )}
              </div>
              {triagem.avaliacao_ia && (
                <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-2">
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
                <div className="space-y-4">
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

                    {triagem.avaliacao_ia.eliminatoriosFalhos &&
                      triagem.avaliacao_ia.eliminatoriosFalhos.trim() !==
                        "" && (
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
                  <p className="text-sm">
                    Nenhuma avaliação de IA disponível para esta triagem.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
