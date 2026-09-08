"use client";

import { Copy, KeyRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";

interface GeneratedPasswordProps {
  username: string;
  password: string;
}

export function GeneratedPassword({
  username,
  password,
}: GeneratedPasswordProps) {
  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      toast.add({ type: "success", description: "Senha copiada." });
    } catch {
      toast.add({
        type: "error",
        description: "Não foi possível copiar. Selecione a senha manualmente.",
      });
    }
  }

  return (
    <Alert>
      <KeyRound />
      <AlertTitle>Senha de {username}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>Copie agora. Por segurança, ela não será exibida novamente.</span>
        <span className="flex items-center gap-2">
          <code className="select-all rounded-md bg-muted px-3 py-2 text-base font-semibold tracking-[0.2em] text-foreground">
            {password}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyPassword}
          >
            <Copy data-icon="inline-start" />
            Copiar
          </Button>
        </span>
      </AlertDescription>
    </Alert>
  );
}
