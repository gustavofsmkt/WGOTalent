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

const STATUS_FILTER_OPTIONS = [
  { value: "todas", label: "Todos os status" },
  { value: "aberta", label: "Aberta" },
  { value: "pausada", label: "Pausada" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
  { value: "incompleta", label: "Incompleta" },
];

export function VagasFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  const currentQuery = searchParams.get("q") ?? "";
  const currentStatus = searchParams.get("status") ?? "todas";
  const [searchTerm, setSearchTerm] = React.useState(currentQuery);

  React.useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const updateFilters = (query: string, status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    if (status && status !== "todas") {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = (term: string) => {
    updateFilters(term, currentStatus);
  };

  const handleStatusChange = (status: string | null) => {
    updateFilters(searchTerm, status ?? "todas");
  };

  const handleClear = () => {
    setSearchTerm("");
    updateFilters("", currentStatus);
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
          placeholder="Buscar por cargo, depto, cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onBlur={() => {
            if (searchTerm !== currentQuery) {
              handleSearch(searchTerm);
            }
          }}
          className="pl-9 pr-8 h-9 text-sm bg-background shadow-xs"
          aria-label="Buscar vaga por cargo, departamento ou cidade"
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
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-9 text-sm bg-background shadow-xs" aria-label="Filtrar por status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
