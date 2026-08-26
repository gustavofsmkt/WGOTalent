import { useSelector } from "@tanstack/react-form";
import { Input } from "../ui/input";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { useFieldContext } from "~/hooks/form";
import FieldErrors from "./fieldErrors";
import { cn } from "~/lib/utils";

export default function InputField({
  label,
  description,
  required,
  className,
  ...props
}: {
  label?: string;
  description?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const field = useFieldContext<string>();

  const meta = useSelector(field.store, (state) => state.meta);

  return (
    <Field>
      <FieldLabel
        htmlFor={field.name}
        className={
          (required && !props.disabled ? "fieldRequiredDot" : "") +
          " ml-0.5 text-nowrap"
        }
      >
        {label}
      </FieldLabel>

      <Input
        className={cn(
          props.disabled
            ? "rounded-none disabled:cursor-default disabled:opacity-100"
            : "",
          className,
        )}
        id={field.name}
        value={field.state.value}
        autoComplete={props.autoComplete}
        type={props.type}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
        placeholder={props.disabled ? "-" : props.placeholder}
      />

      {description && <FieldDescription>{description}</FieldDescription>}

      <FieldErrors meta={meta} />
    </Field>
  );
}
