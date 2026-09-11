"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldLabel } from "~/components/ui/field";

interface SomenteFalhasCheckboxProps {
  checked: boolean;
}

export function SomenteFalhasCheckbox({ checked }: SomenteFalhasCheckboxProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleCheckedChange(nextChecked: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (nextChecked) {
      params.set("somenteFalhas", "1");
    } else {
      params.delete("somenteFalhas");
    }

    const query = params.toString();
    // Navigate directly, not inside startTransition — a wrapped navigation on
    // a dynamic route can be interrupted and require a second click.
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <Field orientation="horizontal" className="w-auto">
      <Checkbox
        id="somente-falhas"
        checked={checked}
        onCheckedChange={(value) => handleCheckedChange(value === true)}
      />
      <FieldLabel htmlFor="somente-falhas">Mostrar apenas falhas</FieldLabel>
    </Field>
  );
}
