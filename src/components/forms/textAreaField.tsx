import { useSelector } from "@tanstack/react-form";
import { Label } from "../ui/label";
import { useFieldContext } from "@/hooks/form";
import FieldErrors from "./fieldErrors";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { Field, FieldDescription, FieldLabel } from "../ui/field";

export default function TextAreaField({
  label,
  description,
  className,
  required,
  ...props
}: {
  label?: string;
  description?: string;
  required?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const field = useFieldContext<string>();

  const meta = useSelector(field.store, (state) => state.meta);

  return (
    <Field>
      <FieldLabel
        htmlFor={field.name}
        className={(required ? "fieldRequiredDot" : "") + " ml-0.5"}
      >
        {label}
      </FieldLabel>

      <Textarea
        className={cn(
          props.disabled
            ? "rounded-none disabled:cursor-default disabled:opacity-100"
            : "",
          className,
        )}
        id={field.name}
        placeholder={props.placeholder}
        value={field.state.value}
        autoComplete={props.autoComplete}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />

      {description && <FieldDescription>{description}</FieldDescription>}

      <FieldErrors meta={meta} />
    </Field>
  );
}
