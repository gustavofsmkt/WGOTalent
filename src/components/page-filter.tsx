"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { useAppForm } from "~/hooks/form";

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

  const form = useAppForm({
    defaultValues: {
      q: currentQuery,
      ...Object.fromEntries(
        (filterBar?.selects ?? []).map((cfg) => [
          cfg.paramKey,
          searchParams.get(cfg.paramKey) ?? cfg.defaultValue,
        ]),
      ),
    } as Record<string, string>,
    onSubmit: ({ value }) => {
      applyParams({ q: value.q?.trim() || null });
    },
  });

  const filterSelectsRef = React.useRef(filterBar?.selects);
  filterSelectsRef.current = filterBar?.selects;

  React.useEffect(() => {
    form.setFieldValue("q", currentQuery);
    for (const cfg of filterSelectsRef.current ?? []) {
      form.setFieldValue(
        cfg.paramKey,
        searchParams.get(cfg.paramKey) ?? cfg.defaultValue,
      );
    }
  }, [searchParams, form]);

  const handleCheckboxChange = (cfg: CheckboxConfig, checked: boolean) => {
    applyParams({ [cfg.paramKey]: checked ? (cfg.trueValue ?? "1") : null });
  };

  const handleClearAll = () => {
    form.setFieldValue("q", "");
    const updates: Record<string, null> = { q: null };
    for (const select of filterBar?.selects ?? []) {
      form.setFieldValue(select.paramKey, select.defaultValue);
      updates[select.paramKey] = null;
    }
    if (filterBar?.checkbox) {
      updates[filterBar.checkbox.paramKey] = null;
    }
    applyParams(updates);
  };

  const hasActiveFilters = React.useMemo(() => {
    if (currentQuery) return true;
    for (const cfg of filterBar?.selects ?? []) {
      const current = searchParams.get(cfg.paramKey) ?? cfg.defaultValue;
      if (current !== cfg.defaultValue) return true;
    }
    if (filterBar?.checkbox) {
      const trueValue = filterBar.checkbox.trueValue ?? "1";
      if (searchParams.get(filterBar.checkbox.paramKey) === trueValue)
        return true;
    }
    return false;
  }, [currentQuery, filterBar, searchParams]);

  const hasFilterBar =
    !!filterBar && (!!filterBar.selects?.length || !!filterBar.checkbox);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Row 1: Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="relative flex items-center max-w-md"
      >
        <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
        <form.Field name="q">
          {(field) => (
            <>
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={() => {
                  field.handleBlur();
                  if (field.state.value !== currentQuery) {
                    applyParams({ q: field.state.value.trim() || null });
                  }
                }}
                className="pl-9 pr-4 h-9 text-sm bg-card"
                aria-label={searchAriaLabel ?? searchPlaceholder}
              />
              {field.state.value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    field.handleChange("");
                    applyParams({ q: null });
                  }}
                  className="absolute right-2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </>
          )}
        </form.Field>
      </form>

      {/* Row 2: Filter bar */}
      {hasFilterBar && (
        <div className="flex items-end gap-x-3 gap-y-2 p-2 bg-card rounded-lg border border-border/60">
          {filterBar!.selects?.map((cfg) => (
            <form.AppField
              key={cfg.paramKey}
              name={cfg.paramKey}
              listeners={{
                onChange: ({ value }) => {
                  applyParams({
                    [cfg.paramKey]: value !== cfg.defaultValue ? value : null,
                  });
                },
              }}
            >
              {(field) => (
                <field.SelectField
                  label={cfg.placeholder}
                  options={cfg.options}
                  placeholder={cfg.placeholder}
                />
              )}
            </form.AppField>
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
              <X className="size-3.5 mr-2" />
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
