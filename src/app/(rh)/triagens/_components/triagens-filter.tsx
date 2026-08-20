"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Kanban, List, Filter } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const ETAPA_OPTIONS = [
  { value: "todas", label: "Todas as Etapas" },
  { value: "curriculo", label: "Currículo" },
  { value: "testes", label: "Testes" },
  { value: "entrevista_rh", label: "Entrevista RH" },
  { value: "entrevista_gestor", label: "Entrevista Gestor" },
  { value: "finalizado", label: "Finalizado" },
];

const RESULTADO_OPTIONS = [
  { value: "todas", label: "Todos os Resultados" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aprovado", label: "Aprovado" },
  { value: "reprovado", label: "Reprovado" },
  { value: "desistente", label: "Desistente" },
  { value: "banco_talentos", label: "Banco de Talentos" },
];

const MOTIVO_OPTIONS = [
  { value: "todos", label: "Todos os Motivos" },
  { value: "curriculo", label: "Reprovação: Currículo" },
  { value: "fit_cultural", label: "Reprovação: Fit Cultural" },
  { value: "testes", label: "Reprovação: Testes Técnicos" },
  { value: "rh", label: "Reprovação: Avaliação RH" },
  { value: "gestor", label: "Reprovação: Avaliação Gestor" },
  { value: "incompatibilidade_salarial", label: "Desistência: Incompatibilidade Salarial" },
  { value: "aceitou_outra_proposta", label: "Desistência: Outra Proposta" },
  { value: "nao_atendeu_contato", label: "Desistência: Não Atendeu Contato" },
  { value: "motivos_pessoais", label: "Desistência: Motivos Pessoais" },
];

export function TriagensFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const currentQuery = searchParams.get("q") ?? "";
  const currentEtapa = searchParams.get("etapa") ?? "todas";
  const currentResultado = searchParams.get("resultado") ?? "todas";
  const currentMotivo = searchParams.get("motivo") ?? "todos";
  const currentView = searchParams.get("view") ?? "pipeline";

  const [searchTerm, setSearchTerm] = React.useState(currentQuery);

  React.useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const updateFilters = (updates: {
    q?: string;
    etapa?: string;
    resultado?: string;
    motivo?: string;
    view?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const nextQuery = updates.q !== undefined ? updates.q : searchTerm;
    const nextEtapa = updates.etapa !== undefined ? updates.etapa : currentEtapa;
    const nextResultado =
      updates.resultado !== undefined ? updates.resultado : currentResultado;
    const nextMotivo = updates.motivo !== undefined ? updates.motivo : currentMotivo;
    const nextView = updates.view !== undefined ? updates.view : currentView;

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    if (nextEtapa && nextEtapa !== "todas") {
      params.set("etapa", nextEtapa);
    } else {
      params.delete("etapa");
    }

    if (nextResultado && nextResultado !== "todas") {
      params.set("resultado", nextResultado);
    } else {
      params.delete("resultado");
    }

    if (nextMotivo && nextMotivo !== "todos") {
      params.set("motivo", nextMotivo);
    } else {
      params.delete("motivo");
    }

    if (nextView && nextView !== "pipeline") {
      params.set("view", nextView);
    } else {
      params.delete("view");
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = (term: string) => {
    updateFilters({ q: term });
  };

  const handleClear = () => {
    setSearchTerm("");
    const params = new URLSearchParams();
    if (currentView !== "pipeline") {
      params.set("view", currentView);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const hasActiveFilters =
    Boolean(currentQuery) ||
    currentEtapa !== "todas" ||
    currentResultado !== "todas" ||
    currentMotivo !== "todos";

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center flex-1 max-w-md"
        >
          <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar por candidato, cargo, departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={() => {
              if (searchTerm !== currentQuery) {
                handleSearch(searchTerm);
              }
            }}
            className="pl-9 pr-8 h-9 text-sm bg-background shadow-xs"
            aria-label="Buscar triagem por candidato, cargo ou departamento"
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setSearchTerm("");
                handleSearch("");
              }}
              className="absolute right-1 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </form>

        {/* View Toggle */}
        <div className="flex items-center gap-1 self-end lg:self-auto bg-muted/70 p-1 rounded-lg border border-border">
          <Button
            type="button"
            variant={currentView === "pipeline" ? "default" : "ghost"}
            size="sm"
            onClick={() => updateFilters({ view: "pipeline" })}
            className="h-7 px-2.5 text-xs font-medium"
            aria-pressed={currentView === "pipeline"}
          >
            <Kanban className="size-3.5 mr-1.5" />
            Pipeline
          </Button>
          <Button
            type="button"
            variant={currentView === "lista" ? "default" : "ghost"}
            size="sm"
            onClick={() => updateFilters({ view: "lista" })}
            className="h-7 px-2.5 text-xs font-medium"
            aria-pressed={currentView === "lista"}
          >
            <List className="size-3.5 mr-1.5" />
            Lista
          </Button>
        </div>
      </div>

      {/* Filter Selects Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-2.5 bg-muted/40 rounded-lg border border-border/60">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mr-1">
          <Filter className="size-3.5" />
          <span>Filtros:</span>
        </div>

        {/* Etapa Select */}
        <div className="w-full sm:w-auto min-w-[170px]">
          <Select
            value={currentEtapa}
            onValueChange={(val) => updateFilters({ etapa: val ?? "todas" })}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              {ETAPA_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resultado Select */}
        <div className="w-full sm:w-auto min-w-[170px]">
          <Select
            value={currentResultado}
            onValueChange={(val) => updateFilters({ resultado: val ?? "todas" })}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Resultado" />
            </SelectTrigger>
            <SelectContent>
              {RESULTADO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Motivo Select */}
        <div className="w-full sm:w-auto min-w-[200px]">
          <Select
            value={currentMotivo}
            onValueChange={(val) => updateFilters({ motivo: val ?? "todos" })}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Motivo" />
            </SelectTrigger>
            <SelectContent>
              {MOTIVO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
