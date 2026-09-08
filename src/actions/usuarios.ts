"use server";

import postgres from "postgres";
import { revalidatePath } from "next/cache";
import type { ActionState } from "~/lib/action-utils";
import { createSession } from "~/lib/auth/session";
import {
  generateNumericPassword,
  hashPassword,
  verifyPassword,
} from "~/lib/auth/password";
import { requireAuthenticatedUser } from "~/lib/auth/dal";
import {
  changePasswordSchema,
  createUsuarioSchema,
  usuarioIdSchema,
} from "~/lib/validation/usuario";
import {
  usuarioRepository,
  type UsuarioSummary,
} from "~/server/db/repositories/usuario";

export interface GeneratedPasswordResult {
  user: UsuarioSummary;
  generatedPassword: string;
}

function toSummary(user: {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}): UsuarioSummary {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createUsuario(
  payload: unknown,
): Promise<ActionState<GeneratedPasswordResult>> {
  await requireAuthenticatedUser();
  const parsed = createUsuarioSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const generatedPassword = generateNumericPassword();
  try {
    const created = await usuarioRepository.create({
      username: parsed.data.username,
      passwordHash: await hashPassword(generatedPassword),
    });
    revalidatePath("/admin/configuracoes/usuarios");
    return {
      success: true,
      message: "Usuário adicionado.",
      data: { user: created, generatedPassword },
    };
  } catch (error) {
    if (error instanceof postgres.PostgresError && error.code === "23505") {
      return { success: false, message: "Este usuário já está cadastrado." };
    }
    return { success: false, message: "Erro ao adicionar usuário." };
  }
}

export async function resetUsuarioPassword(
  id: string,
): Promise<ActionState<GeneratedPasswordResult>> {
  const currentUser = await requireAuthenticatedUser();
  const parsedId = usuarioIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, message: "Usuário inválido." };
  }

  const generatedPassword = generateNumericPassword();
  try {
    const updated = await usuarioRepository.updatePassword(
      parsedId.data,
      await hashPassword(generatedPassword),
    );
    if (!updated) {
      return { success: false, message: "Usuário não encontrado." };
    }

    if (updated.id === currentUser.id) await createSession(updated);
    revalidatePath("/admin/configuracoes/usuarios");
    revalidatePath("/perfil");
    return {
      success: true,
      message: "Senha redefinida.",
      data: { user: toSummary(updated), generatedPassword },
    };
  } catch {
    return { success: false, message: "Erro ao redefinir a senha." };
  }
}

export async function changeOwnPassword(
  payload: unknown,
): Promise<ActionState> {
  const currentUser = await requireAuthenticatedUser();
  const parsed = changePasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os campos informados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await usuarioRepository.findById(currentUser.id);
    if (!user) return { success: false, message: "Usuário não encontrado." };

    const currentPasswordMatches = await verifyPassword(
      parsed.data.currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordMatches) {
      return { success: false, message: "A senha atual está incorreta." };
    }

    const updated = await usuarioRepository.updatePassword(
      user.id,
      await hashPassword(parsed.data.newPassword),
    );
    if (!updated) {
      return { success: false, message: "Usuário não encontrado." };
    }

    await createSession(updated);
    revalidatePath("/perfil");
    return { success: true, message: "Senha alterada com sucesso." };
  } catch {
    return { success: false, message: "Erro ao alterar a senha." };
  }
}
