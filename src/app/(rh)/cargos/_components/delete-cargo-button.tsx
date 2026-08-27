"use client";

import { deleteCargo } from "~/actions/cargos";
import { DeleteWithConfirmButton } from "~/components/delete-with-confirm-button";

interface DeleteCargoButtonProps {
  cargoId: string;
  cargoTitulo: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function DeleteCargoButton({
  cargoId,
  cargoTitulo,
  redirectTo,
  variant = "icon",
  className,
}: DeleteCargoButtonProps) {
  return (
    <DeleteWithConfirmButton
      onDelete={() => deleteCargo(cargoId)}
      label={cargoTitulo}
      redirectTo={redirectTo}
      variant={variant}
      className={className}
    />
  );
}
