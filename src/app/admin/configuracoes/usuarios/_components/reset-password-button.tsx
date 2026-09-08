"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import type { ActionState } from "~/lib/action-utils";
import type { GeneratedPasswordResult } from "~/actions/usuarios";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { GeneratedPassword } from "./generated-password";

interface ResetPasswordButtonProps {
  userId: string;
  username: string;
  action: (id: string) => Promise<ActionState<GeneratedPasswordResult>>;
}

export function ResetPasswordButton({
  userId,
  username,
  action,
}: ResetPasswordButtonProps) {
  const [open, setOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function resetPassword() {
    startTransition(async () => {
      const result = await action(userId);
      if (!result.success || !result.data) {
        toast.add({
          type: "error",
          description: result.message ?? "Erro ao redefinir a senha.",
        });
        return;
      }
      setGeneratedPassword(result.data.generatedPassword);
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setGeneratedPassword(null);
      }}
    >
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        <KeyRound data-icon="inline-start" />
        Redefinir senha
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {generatedPassword
              ? "Senha redefinida"
              : `Redefinir senha de ${username}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {generatedPassword
              ? "A senha anterior deixou de funcionar."
              : "A senha atual será substituída por uma senha numérica gerada automaticamente."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {generatedPassword ? (
          <GeneratedPassword username={username} password={generatedPassword} />
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel>
            {generatedPassword ? "Fechar" : "Cancelar"}
          </AlertDialogCancel>
          {!generatedPassword ? (
            <AlertDialogAction
              type="button"
              onClick={resetPassword}
              disabled={isPending}
            >
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              {isPending ? "Redefinindo..." : "Confirmar redefinição"}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
