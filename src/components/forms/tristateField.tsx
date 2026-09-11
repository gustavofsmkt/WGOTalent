import { useFieldContext } from "~/hooks/form";
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

/**
 * Campo tri-state (true/false/null) para dados que só têm valor quando
 * declarados explicitamente — `null` significa "não informado". Usado em
 * possuiVeiculo, ensinoMedioConcluido, disponivelViagens, disponivelMudanca e
 * inicioImediato, cujas colunas são booleanos nuláveis. Um checkbox comum não
 * consegue representar os três estados (colapsa null em false), então mapeamos
 * o boolean nulável para/de um Select de três opções.
 */
type TristateFieldProps = {
  label?: React.ReactNode;
  description?: string;
  trueLabel?: string;
  falseLabel?: string;
  disabled?: boolean;
};

const NULL_VALUE = "nao_informado";
const TRUE_VALUE = "sim";
const FALSE_VALUE = "nao";

function toSelectValue(value: boolean | null | undefined): string {
  if (value === true) return TRUE_VALUE;
  if (value === false) return FALSE_VALUE;
  return NULL_VALUE;
}

function fromSelectValue(value: string | null): boolean | null {
  if (value === TRUE_VALUE) return true;
  if (value === FALSE_VALUE) return false;
  return null;
}

export default function TristateField({
  label,
  description,
  trueLabel = "Sim",
  falseLabel = "Não",
  disabled,
}: TristateFieldProps) {
  const field = useFieldContext<boolean | null>();
  const meta = useSelector(field.store, (state) => state.meta);

  return (
    <Field>
      <FieldLabel htmlFor={field.name} className="ml-0.5 text-nowrap">
        {label}
      </FieldLabel>
      <Select
        value={toSelectValue(field.state.value)}
        onValueChange={(value) => field.handleChange(fromSelectValue(value))}
        disabled={disabled}
      >
        <SelectTrigger
          className="m-0 w-full"
          id={field.name}
          onBlur={field.handleBlur}
          disabled={disabled}
        >
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={NULL_VALUE}>Não informado</SelectItem>
          <SelectItem value={TRUE_VALUE}>{trueLabel}</SelectItem>
          <SelectItem value={FALSE_VALUE}>{falseLabel}</SelectItem>
        </SelectContent>
      </Select>

      {description && <FieldDescription>{description}</FieldDescription>}

      <FieldErrors meta={meta} />
    </Field>
  );
}
