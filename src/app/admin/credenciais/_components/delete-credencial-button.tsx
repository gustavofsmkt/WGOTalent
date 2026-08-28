"use client";

import { deleteCredencial } from "~/actions/credenciais";
import { DeleteWithConfirmButton } from "~/components/delete-with-confirm-button";

interface DeleteCredencialButtonProps {
  credencialId: string;
}

export function DeleteCredencialButton({
  credencialId,
}: DeleteCredencialButtonProps) {
  return (
    <DeleteWithConfirmButton
      onDelete={() => deleteCredencial(credencialId)}
      label="credencial"
      variant="button"
    />
  );
}
