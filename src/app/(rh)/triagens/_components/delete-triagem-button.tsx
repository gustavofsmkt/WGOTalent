"use client";

import { deleteTriagem } from "~/actions/triagens";
import { DeleteWithConfirmButton } from "~/components/delete-with-confirm-button";

interface DeleteTriagemButtonProps {
  triagemId: string;
  candidatoNome?: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function DeleteTriagemButton({
  triagemId,
  candidatoNome = "esta triagem",
  redirectTo,
  variant = "icon",
  className,
}: DeleteTriagemButtonProps) {
  return (
    <DeleteWithConfirmButton
      onDelete={() => deleteTriagem(triagemId)}
      label={candidatoNome}
      redirectTo={redirectTo}
      variant={variant}
      buttonLabel="Excluir Triagem"
      buttonVariant="destructive"
      className={className}
    />
  );
}
