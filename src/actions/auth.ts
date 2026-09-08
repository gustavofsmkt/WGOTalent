"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { env } from "~/env";
import { loginSchema } from "~/lib/validation/usuario";
import { usuarioRepository } from "~/server/db/repositories/usuario";
import { verifyPassword } from "~/lib/auth/password";
import { createSession, deleteSession } from "~/lib/auth/session";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  getLoginAttemptKeys,
  reserveLoginAttempt,
} from "~/lib/auth/login-rate-limit";

export interface LoginState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
}

const DUMMY_PASSWORD_HASH =
  "scrypt$T6pq2lRx-1dyf1_jH-ioxQ$a0CiNSd4L8AaB2kkti0N83N0ZnmcMrWMBpSb0largwnvoVqGljy4UAjb4oiweIMHoFG4k5Dw5GYwQLUyu8ep1w";

function safeRedirectPath(value: FormDataEntryValue | null): string {
  if (
    typeof value !== "string" ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    return "/dashboard";
  }
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/login")
  ) {
    return "/dashboard";
  }
  try {
    const baseUrl = new URL("http://wgotalent.local");
    const targetUrl = new URL(value, baseUrl);
    if (targetUrl.origin !== baseUrl.origin) return "/dashboard";
    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
  } catch {
    return "/dashboard";
  }
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os campos informados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const attemptKeys = getLoginAttemptKeys(
    await headers(),
    parsed.data.username,
    env.NODE_ENV === "production" ? undefined : "local-development",
  );
  if (!attemptKeys) {
    console.error(
      "[auth] Login recusado: proxy não informou o endereço do cliente.",
    );
    return {
      success: false,
      message: "Não foi possível validar a origem da conexão. Tente novamente.",
    };
  }
  const rateLimit = checkLoginRateLimit(attemptKeys);
  if (!rateLimit.allowed) {
    const minutes = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60));
    return {
      success: false,
      message: `Muitas tentativas. Aguarde ${minutes} minuto${minutes === 1 ? "" : "s"} e tente novamente.`,
    };
  }
  // Reserve synchronously before the expensive password verification so a
  // concurrent burst cannot pass the same pre-check multiple times.
  reserveLoginAttempt(attemptKeys);

  let user: Awaited<ReturnType<typeof usuarioRepository.findByUsername>> = null;
  let passwordMatches = false;
  try {
    user = await usuarioRepository.findByUsername(parsed.data.username);
    passwordMatches = await verifyPassword(
      parsed.data.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
  } catch {
    return {
      success: false,
      message: "Não foi possível entrar. Tente novamente.",
    };
  }

  if (!user || !passwordMatches) {
    return {
      success: false,
      message: "Usuário ou senha inválidos.",
    };
  }

  clearLoginAttempts(attemptKeys);
  try {
    await createSession(user);
  } catch {
    return {
      success: false,
      message: "Não foi possível iniciar a sessão. Tente novamente.",
    };
  }
  redirect(safeRedirectPath(formData.get("next")));
}

export async function logout(): Promise<never> {
  await deleteSession();
  redirect("/login");
}
