"use client";

import { deleteVaga } from "~/actions/vagas";
import { DeleteWithConfirmButton } from "~/components/delete-with-confirm-button";

interface DeleteVagaButtonProps {
  vagaId: string;
  vagaTitulo?: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function DeleteVagaButton({
  vagaId,
  vagaTitulo = "esta vaga",
  redirectTo,
  variant = "icon",
  className,
}: DeleteVagaButtonProps) {
  return (
    <DeleteWithConfirmButton
      onDelete={() => deleteVaga(vagaId)}
      label={vagaTitulo}
      redirectTo={redirectTo}
      variant={variant}
      className={className}
    />
  );
}
