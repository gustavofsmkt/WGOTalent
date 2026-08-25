"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const ORIGEM_FILTER_OPTIONS = [
  { value: "todas", label: "Todas as origens" },
  { value: "manual", label: "Manual (RH)" },
  { value: "email", label: "E-mail (IA)" },
  { value: "indicacao", label: "Indicação" },
];

const POOL_FILTER_OPTIONS = [
  { value: "todos", label: "Todos os candidatos" },
  { value: "banco_talentos", label: "Banco de Talentos" },
];

export function CandidatosFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  const currentQuery = searchParams.get("q") ?? "";
  const currentOrigem = searchParams.get("origem") ?? "todas";
  const currentPool = searchParams.get("pool") ?? "todos";
  const [searchTerm, setSearchTerm] = React.useState(currentQuery);

  React.useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const updateFilters = (query: string, origem: string, pool: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    if (origem && origem !== "todas") {
      params.set("origem", origem);
    } else {
      params.delete("origem");
    }

    if (pool && pool !== "todos") {
      params.set("pool", pool);
    } else {
      params.delete("pool");
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = (term: string) => {
    updateFilters(term, currentOrigem, currentPool);
  };

  const handleOrigemChange = (origem: string | null) => {
    updateFilters(searchTerm, origem ?? "todas", currentPool);
  };

  const handlePoolChange = (pool: string | null) => {
    updateFilters(searchTerm, currentOrigem, pool ?? "todos");
  };

  const handleClear = () => {
    setSearchTerm("");
    updateFilters("", currentOrigem, currentPool);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center flex-1 max-w-md"
      >
        <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar por nome, e-mail, cidade ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onBlur={() => {
            if (searchTerm !== currentQuery) {
              handleSearch(searchTerm);
            }
          }}
          className="pl-9 pr-8 h-9 text-sm bg-background shadow-xs"
          aria-label="Buscar candidato por nome, e-mail, cidade ou cargo"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleClear}
            className="absolute right-2 text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </form>

      <div className="w-full sm:w-48">
        <Select
          value={currentOrigem}
          onValueChange={handleOrigemChange}
        >
          <SelectTrigger className="h-9 text-xs bg-background shadow-xs">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            {ORIGEM_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-48">
        <Select
          value={currentPool}
          onValueChange={handlePoolChange}
        >
          <SelectTrigger className="h-9 text-xs bg-background shadow-xs">
            <SelectValue placeholder="Banco de Talentos" />
          </SelectTrigger>
          <SelectContent>
            {POOL_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
