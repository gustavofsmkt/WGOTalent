"use client";

import { deleteEmailCredencial } from "~/actions/email-credenciais";
import { DeleteWithConfirmButton } from "~/components/delete-with-confirm-button";

interface DeleteEmailCredencialButtonProps {
  credencialId: string;
}

export function DeleteEmailCredencialButton({
  credencialId,
}: DeleteEmailCredencialButtonProps) {
  return (
    <DeleteWithConfirmButton
      onDelete={() => deleteEmailCredencial(credencialId)}
      label="credencial de e-mail"
      variant="button"
    />
  );
}
