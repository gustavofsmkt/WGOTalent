import * as React from "react";
import { User, MapPin, ShieldCheck, Car, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import type { CandidatoDetailCompleto } from "~/server/db/repositories/candidato";

interface CandidatePersonalInfoProps {
  candidato: CandidatoDetailCompleto;
}

export function CandidatePersonalInfo({ candidato }: CandidatePersonalInfoProps) {
  const calculateAge = (birthDateStr: string) => {
    try {
      const birth = new Date(birthDateStr);
      if (isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Não informado";
    try {
      const [year, month, day] = dateStr.split("-");
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const formatEstadoCivil = (status?: string | null) => {
    switch (status) {
      case "solteiro":
        return "Solteiro(a)";
      case "casado":
        return "Casado(a)";
      case "divorciado":
        return "Divorciado(a)";
      case "viuvo":
        return "Viúvo(a)";
      case "uniao_estavel":
        return "União Estável";
      case "nao_informado":
      default:
        return "Não informado";
    }
  };

  const formatCNH = (cnh?: string | null) => {
    if (!cnh) return "Não possui";
    return `Categoria ${cnh.toUpperCase()}`;
  };

  const formatCep = (cep?: string | null) => {
    if (!cep) return "Não informado";
    const digits = cep.replace(/\D/g, "");
    if (digits.length === 8) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return cep;
  };

  const age = calculateAge(candidato.dataNascimento);

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <User className="size-4 text-primary" />
          Dados Pessoais e Localização
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Personal Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Data de Nascimento
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {formatDate(candidato.dataNascimento)}
              {age !== null ? ` (${age} anos)` : ""}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Nacionalidade
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {candidato.nacionalidade || "Brasileira"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Estado Civil
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {formatEstadoCivil(candidato.estadoCivil)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              PCD
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {candidato.pcd ? candidato.pcd : "Não aplicável"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              CNH
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {formatCNH(candidato.cnh)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Veículo Próprio
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {candidato.possuiVeiculo ? "Sim" : "Não"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ensino Médio
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {candidato.ensinoMedioConcluido ? "Concluído" : "Não concluído"}
            </p>
          </div>
        </div>

        <Separator className="bg-border/60" />

        {/* Address Info */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-3.5 text-primary" />
            Endereço Residencial
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm pt-1">
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Logradouro / Bairro</p>
              <p className="font-medium text-foreground mt-0.5">
                {candidato.logradouro}
                {candidato.bairro ? ` - ${candidato.bairro}` : ""}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Cidade / UF</p>
              <p className="font-medium text-foreground mt-0.5">
                {candidato.cidade}/{candidato.uf}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">CEP</p>
              <p className="font-medium text-foreground mt-0.5">
                {formatCep(candidato.cep)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
