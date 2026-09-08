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
  falseValue?: string;
  defaultChecked?: boolean;
  label: string;
}

export interface NumberInputConfig {
  paramKey: string;
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export interface PageFilterProps {
  searchPlaceholder: string;
  searchAriaLabel?: string;
  pageParam?: string;
  filterBar?: {
    selects?: SelectConfig[];
    numberInputs?: NumberInputConfig[];
    checkbox?: CheckboxConfig;
  };
}

const URL_SYNC_OPTIONS = {
  dontRunListeners: true,
  dontUpdateMeta: true,
  dontValidate: true,
} as const;

function getCheckboxChecked(
  searchParams: Pick<URLSearchParams, "get">,
  config: CheckboxConfig,
) {
  const value = searchParams.get(config.paramKey);
  if (value === (config.trueValue ?? "1")) return true;
  if (value === (config.falseValue ?? "0")) return false;
  return config.defaultChecked ?? false;
}

function normalizeNumberInput(value: string, config: NumberInputConfig) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const parsedValue = Number(trimmedValue);
  if (!Number.isFinite(parsedValue)) return null;

  const minimum = config.min ?? Number.NEGATIVE_INFINITY;
  const maximum = config.max ?? Number.POSITIVE_INFINITY;
  return String(Math.min(maximum, Math.max(minimum, parsedValue)));
}

export function PageFilter({
  searchPlaceholder,
  searchAriaLabel,
  pageParam = "page",
  filterBar,
}: PageFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const currentQuery = searchParams.get("q") ?? "";

  const applyParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(pageParam);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const query = params.toString();
    startTransition(() =>
      router.replace(query ? `${pathname}?${query}` : pathname),
    );
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
      ...Object.fromEntries(
        (filterBar?.numberInputs ?? []).map((cfg) => [
          cfg.paramKey,
          searchParams.get(cfg.paramKey) ?? "",
        ]),
      ),
    } as Record<string, string>,
    onSubmit: ({ value }) => {
      applyParams({ q: value.q?.trim() || null });
    },
  });

  const filterSelectsRef = React.useRef(filterBar?.selects);
  filterSelectsRef.current = filterBar?.selects;
  const filterNumberInputsRef = React.useRef(filterBar?.numberInputs);
  filterNumberInputsRef.current = filterBar?.numberInputs;

  React.useEffect(() => {
    form.setFieldValue("q", currentQuery, URL_SYNC_OPTIONS);
    for (const cfg of filterSelectsRef.current ?? []) {
      form.setFieldValue(
        cfg.paramKey,
        searchParams.get(cfg.paramKey) ?? cfg.defaultValue,
        URL_SYNC_OPTIONS,
      );
    }
    for (const cfg of filterNumberInputsRef.current ?? []) {
      form.setFieldValue(
        cfg.paramKey,
        searchParams.get(cfg.paramKey) ?? "",
        URL_SYNC_OPTIONS,
      );
    }
  }, [currentQuery, searchParams, form]);

  const handleCheckboxChange = (cfg: CheckboxConfig, checked: boolean) => {
    const defaultChecked = cfg.defaultChecked ?? false;
    applyParams({
      [cfg.paramKey]:
        checked === defaultChecked
          ? null
          : checked
            ? (cfg.trueValue ?? "1")
            : (cfg.falseValue ?? "0"),
    });
  };

  const handleClearAll = () => {
    form.setFieldValue("q", "", URL_SYNC_OPTIONS);
    const updates: Record<string, null> = { q: null };
    for (const select of filterBar?.selects ?? []) {
      form.setFieldValue(
        select.paramKey,
        select.defaultValue,
        URL_SYNC_OPTIONS,
      );
      updates[select.paramKey] = null;
    }
    for (const input of filterBar?.numberInputs ?? []) {
      form.setFieldValue(input.paramKey, "", URL_SYNC_OPTIONS);
      updates[input.paramKey] = null;
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
    for (const cfg of filterBar?.numberInputs ?? []) {
      if (searchParams.get(cfg.paramKey)?.trim()) return true;
    }
    if (filterBar?.checkbox) {
      const checked = getCheckboxChecked(searchParams, filterBar.checkbox);
      if (checked !== (filterBar.checkbox.defaultChecked ?? false)) return true;
    }
    return false;
  }, [currentQuery, filterBar, searchParams]);

  const hasFilterBar =
    !!filterBar &&
    (!!filterBar.selects?.length ||
      !!filterBar.numberInputs?.length ||
      !!filterBar.checkbox);

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

          {filterBar!.numberInputs?.map((cfg) => (
            <form.Field key={cfg.paramKey} name={cfg.paramKey}>
              {(field) => (
                <div className="grid gap-1.5">
                  <label
                    htmlFor={`filter-number-${cfg.paramKey}`}
                    className="ml-0.5 text-xs font-medium text-nowrap"
                  >
                    {cfg.label}
                  </label>
                  <div className="relative w-32">
                    <Input
                      id={`filter-number-${cfg.paramKey}`}
                      type="number"
                      inputMode="numeric"
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step}
                      placeholder={cfg.placeholder}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                      }}
                      onBlur={() => {
                        field.handleBlur();
                        const normalizedValue = normalizeNumberInput(
                          field.state.value,
                          cfg,
                        );
                        field.handleChange(normalizedValue ?? "");
                        applyParams({ [cfg.paramKey]: normalizedValue });
                      }}
                      className={cfg.suffix ? "pr-8" : undefined}
                      aria-label={cfg.label}
                    />
                    {cfg.suffix && (
                      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
                        {cfg.suffix}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </form.Field>
          ))}

          {filterBar!.checkbox && (
            <label
              htmlFor={`filter-cb-${filterBar!.checkbox.paramKey}`}
              className="flex items-center gap-2 h-8 px-2 text-xs font-medium text-foreground cursor-pointer select-none"
            >
              <Checkbox
                id={`filter-cb-${filterBar!.checkbox.paramKey}`}
                checked={getCheckboxChecked(searchParams, filterBar!.checkbox)}
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
