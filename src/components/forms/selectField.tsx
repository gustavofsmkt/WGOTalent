import { useFieldContext } from "@/hooks/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import FieldErrors from "./fieldErrors";
import { useSelector } from "@tanstack/react-form";
import { Field, FieldDescription, FieldLabel } from "../ui/field";

export type SelectOption = {
  value: string;
  label: React.ReactNode;
  description?: string;
};

type SelectFieldProps = {
  options: SelectOption[];
  label?: React.ReactNode;
  description?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
} & React.ComponentProps<typeof Select>;

export default function SelectField({
  label,
  description,
  options,
  placeholder,
  required,
  disabled,
  ...props
}: SelectFieldProps) {
  const field = useFieldContext<string>();
  const meta = useSelector(field.store, (state) => state.meta);

  return (
    <Field>
      <FieldLabel
        htmlFor={field.name}
        className={
          (required && !disabled ? "fieldRequiredDot" : "") +
          " ml-0.5 text-nowrap"
        }
      >
        {label}
      </FieldLabel>

      <Select
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value as string)}
        {...props}
      >
        <SelectTrigger
          className={
            "m-0 w-full " +
            (disabled
              ? "rounded-none disabled:cursor-default disabled:bg-input/50 disabled:opacity-100 [&_svg]:hidden"
              : "")
          }
          id={field.name}
          onBlur={field.handleBlur}
          disabled={disabled}
        >
          <SelectValue placeholder={disabled ? "-" : placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {description && <FieldDescription>{description}</FieldDescription>}

      <FieldErrors meta={meta} />
    </Field>
  );
}
