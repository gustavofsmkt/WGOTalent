import * as React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Globe,
  FileText,
  Pencil,
  ExternalLink,
} from "lucide-react";
import { buttonVariants } from "~/components/ui/button";
import { StatusBadge, type StatusTone } from "~/components/status-badge";
import { DeleteCandidatoButton } from "~/app/(rh)/candidatos/_components/delete-candidato-button";
import type { CandidatoDetailCompleto } from "~/server/db/repositories/candidato";
import { getWhatsAppUrl } from "~/lib/whatsapp";

interface CandidateHeaderProps {
  candidato: CandidatoDetailCompleto;
}

export function CandidateHeader({ candidato }: CandidateHeaderProps) {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return (parts[0]?.substring(0, 2) ?? "").toUpperCase();
    const first = parts[0]?.charAt(0) ?? "";
    const last = parts[parts.length - 1]?.charAt(0) ?? "";
    return `${first}${last}`.toUpperCase();
  };

  const getOrigemBadge = (origem: string) => {
    switch (origem) {
      case "email":
        return { label: "E-mail (IA)", tone: "info" as StatusTone };
      case "indicacao":
        return { label: "Indicação", tone: "success" as StatusTone };
      case "manual":
      default:
        return { label: "Manual", tone: "neutral" as StatusTone };
    }
  };

  const origemBadge = getOrigemBadge(candidato.origem);

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/candidatos"
          className="hover:text-foreground transition-colors"
        >
          Candidatos
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground font-medium">Detalhes</span>
      </div>

      {/* Main Profile Header Banner */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between bg-card border border-border/60 p-6 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar / Initials */}
          <div className="size-16 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xl shrink-0">
            {getInitials(candidato.nome)}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {candidato.nome}
              </h1>
              <StatusBadge
                tone={origemBadge.tone}
                label={origemBadge.label}
                className="text-xs font-medium"
              />
            </div>

            {candidato.nomeSocial && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground/80">Nome Social:</span>{" "}
                {candidato.nomeSocial}
              </p>
            )}

            {/* Quick Contact & Info line */}
            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-sm text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="size-4 text-muted-foreground/70" />
                <a
                  href={`mailto:${candidato.email}`}
                  className="hover:text-primary transition-colors"
                >
                  {candidato.email}
                </a>
              </span>

              <span className="flex items-center gap-1.5">
                <Smartphone className="size-4 text-muted-foreground/70" />
                <a
                  href={getWhatsAppUrl(candidato.celular)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {candidato.celular}
                </a>
              </span>

              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-muted-foreground/70" />
                <span>
                  {candidato.cidade}/{candidato.uf}
                </span>
              </span>

              {candidato.linkedin && (
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="size-4 text-muted-foreground/70" />
                  <a
                    href={candidato.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    LinkedIn
                  </a>
                </span>
              )}

              {candidato.portfolio && (
                <span className="flex items-center gap-1.5">
                  <Globe className="size-4 text-muted-foreground/70" />
                  <a
                    href={candidato.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Portfólio
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions cluster */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0">
          {candidato.curriculoArquivoKey && (
            <a
              href={`/api/files/${candidato.curriculoArquivoKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                size: "default",
                className: "flex items-center gap-2",
              })}
            >
              <FileText className="size-4" />
              <span>Ver Currículo</span>
            </a>
          )}

          <Link
            href={`/candidatos/${candidato.id}/editar`}
            className={buttonVariants({
              variant: "outline",
              size: "default",
              className: "flex items-center gap-2",
            })}
          >
            <Pencil className="size-4" />
            <span>Editar</span>
          </Link>

          <DeleteCandidatoButton
            candidatoId={candidato.id}
            candidatoNome={candidato.nome}
            redirectTo="/candidatos"
            variant="button"
          />
        </div>
      </div>
    </div>
  );
}
