"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Field, FieldLabel } from "./ui/field";

export interface FilterOption {
  value: string;
  label: string;
}

export interface SelectConfig {
  paramKey: string;
  defaultValue: string;
  placeholder: string;
  options: FilterOption[];
}

export interface CheckboxConfig {
  paramKey: string;
  trueValue?: string;
  label: string;
}

export interface PageFilterProps {
  searchPlaceholder: string;
  searchAriaLabel?: string;
  filterBar?: {
    selects?: SelectConfig[];
    checkbox?: CheckboxConfig;
  };
}

export function PageFilter({
  searchPlaceholder,
  searchAriaLabel,
  filterBar,
}: PageFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const currentQuery = searchParams.get("q") ?? "";
  const [searchTerm, setSearchTerm] = React.useState(currentQuery);

  React.useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const getSelectValue = React.useCallback(
    (cfg: SelectConfig) => searchParams.get(cfg.paramKey) ?? cfg.defaultValue,
    [searchParams],
  );

  const applyParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  const handleSearchApply = (term: string) => {
    applyParams({ q: term.trim() || null });
  };

  const handleSelectChange = (cfg: SelectConfig, value: string) => {
    applyParams({
      [cfg.paramKey]: value !== cfg.defaultValue ? value : null,
    });
  };

  const handleCheckboxChange = (cfg: CheckboxConfig, checked: boolean) => {
    applyParams({ [cfg.paramKey]: checked ? (cfg.trueValue ?? "1") : null });
  };

  const handleClearAll = () => {
    setSearchTerm("");
    const updates: Record<string, null> = { q: null };
    for (const select of filterBar?.selects ?? []) {
      updates[select.paramKey] = null;
    }
    if (filterBar?.checkbox) {
      updates[filterBar.checkbox.paramKey] = null;
    }
    applyParams(updates);
  };

  const hasActiveFilters = React.useMemo(() => {
    if (currentQuery) return true;
    for (const select of filterBar?.selects ?? []) {
      if (getSelectValue(select) !== select.defaultValue) return true;
    }
    if (filterBar?.checkbox) {
      const trueValue = filterBar.checkbox.trueValue ?? "1";
      if (searchParams.get(filterBar.checkbox.paramKey) === trueValue)
        return true;
    }
    return false;
  }, [currentQuery, filterBar, getSelectValue, searchParams]);

  const hasFilterBar =
    !!filterBar && (!!filterBar.selects?.length || !!filterBar.checkbox);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Row 1: Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchApply(searchTerm);
        }}
        className="relative flex items-center max-w-md"
      >
        <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onBlur={() => {
            if (searchTerm !== currentQuery) handleSearchApply(searchTerm);
          }}
          className="pl-9 pr-8 h-9 text-sm  shadow-xs"
          aria-label={searchAriaLabel ?? searchPlaceholder}
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setSearchTerm("");
              applyParams({ q: null });
            }}
            className="absolute right-2 text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </form>

      {/* Row 2: Filter bar */}
      {hasFilterBar && (
        <div className="flex  items-end gap-x-3 gap-y-2 p-2.5 bg-card rounded-lg border border-border/60">
          {filterBar!.selects?.map((cfg) => (
            <Field key={cfg.paramKey}>
              <FieldLabel
                htmlFor={`filter-select-${cfg.paramKey}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {cfg.placeholder}
              </FieldLabel>
              <Select
                value={getSelectValue(cfg)}
                onValueChange={(val) => handleSelectChange(cfg, val as string)}
              >
                <SelectTrigger id={`filter-select-${cfg.paramKey}`}>
                  <SelectValue placeholder={cfg.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {cfg.options.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      <span className="whitespace-normal break-words">
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ))}

          {filterBar!.checkbox && (
            <label
              htmlFor={`filter-cb-${filterBar!.checkbox.paramKey}`}
              className="flex items-center gap-2 h-8 px-2 text-xs font-medium text-foreground cursor-pointer select-none"
            >
              <Checkbox
                id={`filter-cb-${filterBar!.checkbox.paramKey}`}
                checked={
                  searchParams.get(filterBar!.checkbox.paramKey) ===
                  (filterBar!.checkbox.trueValue ?? "1")
                }
                onCheckedChange={(checked) =>
                  handleCheckboxChange(filterBar!.checkbox!, checked === true)
                }
              />
              {filterBar!.checkbox.label}
            </label>
          )}

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
