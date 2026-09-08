"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import type { LoginState } from "~/actions/auth";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";

const initialState: LoginState = { success: false };

interface LoginFormProps {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
  nextPath: string;
}

export function LoginForm({ action, nextPath }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const usernameError = state.errors?.username?.[0];
  const passwordError = state.errors?.password?.[0];

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={nextPath} />

      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field data-invalid={Boolean(usernameError)}>
          <FieldLabel htmlFor="username">Usuário</FieldLabel>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            autoFocus
            required
            aria-invalid={Boolean(usernameError)}
          />
          <FieldError>{usernameError}</FieldError>
        </Field>

        <Field data-invalid={Boolean(passwordError)}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(passwordError)}
          />
          <FieldError>{passwordError}</FieldError>
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <LogIn data-icon="inline-start" />
        )}
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
