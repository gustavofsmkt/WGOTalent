import { useFieldContext } from "~/hooks/form";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import FieldErrors from "./fieldErrors";
import { useSelector } from "@tanstack/react-form";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { cn } from "~/lib/utils";

type CheckboxFieldProps = {
  label: string;
  description?: string;
  disabled?: boolean;
};

export default function CheckboxField({
  label,
  description,
  disabled,
}: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();
  const meta = useSelector(field.store, (state) => state.meta);

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(disabled ? "" : "rounded-md", "h-8 border px-2")}
      >
        <Field orientation={"horizontal"}>
          <Checkbox
            id={field.name}
            checked={field.state.value}
            onCheckedChange={(checked) => {
              field.handleChange(checked === true);
            }}
            onBlur={field.handleBlur}
            disabled={disabled}
            className="disabled:rounded-none disabled:opacity-100 disabled:[&_span]:rounded-none"
          />
          <FieldLabel htmlFor={field.name} className="cursor-pointer">
            {label}
          </FieldLabel>

          <FieldErrors meta={meta} />
        </Field>
      </TooltipTrigger>

      {description && (
        <TooltipContent className="flex flex-col">
          <FieldDescription className="text-sm text-primary-foreground">
            {description}
          </FieldDescription>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
