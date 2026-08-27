"use client";

import { deleteDepartamento } from "~/actions/departamentos";
import { DeleteWithConfirmButton } from "~/components/delete-with-confirm-button";

interface DeleteDepartamentoButtonProps {
  departamentoId: string;
  departamentoNome: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function DeleteDepartamentoButton({
  departamentoId,
  departamentoNome,
  redirectTo,
  variant = "icon",
  className,
}: DeleteDepartamentoButtonProps) {
  return (
    <DeleteWithConfirmButton
      onDelete={() => deleteDepartamento(departamentoId)}
      label={departamentoNome}
      redirectTo={redirectTo}
      variant={variant}
      className={className}
    />
  );
}
