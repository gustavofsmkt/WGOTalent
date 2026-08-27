"use client";

import { deleteCandidato } from "~/actions/candidatos";
import { DeleteWithConfirmButton } from "~/components/delete-with-confirm-button";

interface DeleteCandidatoButtonProps {
  candidatoId: string;
  candidatoNome?: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function DeleteCandidatoButton({
  candidatoId,
  candidatoNome = "este candidato",
  redirectTo,
  variant = "icon",
  className,
}: DeleteCandidatoButtonProps) {
  return (
    <DeleteWithConfirmButton
      onDelete={() => deleteCandidato(candidatoId)}
      label={candidatoNome}
      redirectTo={redirectTo}
      variant={variant}
      buttonLabel="Excluir Candidato"
      buttonVariant="destructive"
      className={className}
    />
  );
}
