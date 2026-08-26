import { AnyFieldMeta } from "@tanstack/react-form";
import { ZodError } from "zod";

type FieldErrorsProps = {
  meta: AnyFieldMeta;
};

export default function FieldErrors({ meta }: FieldErrorsProps) {
  if (!meta.isTouched) return null;

  return meta.errors.map(({ message }: ZodError, index) => (
    <p key={index} className="ml-1 text-[0.8rem] font-medium text-destructive">
      {message}
    </p>
  ));
}
