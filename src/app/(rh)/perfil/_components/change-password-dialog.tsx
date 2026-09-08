"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import type { ActionState } from "~/lib/action-utils";
import {
  changePasswordClientBase,
  changePasswordClientSchema,
} from "~/lib/validation/usuario.client";
import { useAppForm } from "~/hooks/form";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { FieldGroup } from "~/components/ui/field";
import { toast } from "~/components/ui/toast";

interface ChangePasswordDialogProps {
  action: (payload: unknown) => Promise<ActionState>;
}

export function ChangePasswordDialog({ action }: ChangePasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useAppForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: { onBlur: changePasswordClientSchema },
    onSubmit: async ({ value }) => {
      const result = await action(value);
      if (!result.success) {
        toast.add({
          type: "error",
          description: result.message ?? "Erro ao alterar a senha.",
        });
        return;
      }
      toast.add({ type: "success", description: result.message });
      form.reset();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <KeyRound data-icon="inline-start" />
        Alterar senha
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>
            Confirme sua senha atual e escolha uma nova com pelo menos 8
            caracteres.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <form.AppField
              name="currentPassword"
              validators={{
                onBlur: changePasswordClientBase.shape.currentPassword,
              }}
            >
              {(field) => (
                <field.InputField
                  label="Senha atual"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              )}
            </form.AppField>
            <form.AppField
              name="newPassword"
              validators={{
                onBlur: changePasswordClientBase.shape.newPassword,
              }}
            >
              {(field) => (
                <field.InputField
                  label="Nova senha"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              )}
            </form.AppField>
            <form.AppField
              name="confirmPassword"
              validators={{
                onBlur: changePasswordClientBase.shape.confirmPassword,
              }}
            >
              {(field) => (
                <field.InputField
                  label="Confirmar nova senha"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              )}
            </form.AppField>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <form.AppForm>
              <form.SaveButton label="Salvar nova senha" />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
