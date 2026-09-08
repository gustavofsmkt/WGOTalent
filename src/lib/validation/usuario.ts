import { z } from "zod";

export const usernameSchema = z
  .string({ required_error: "Informe o usuário." })
  .trim()
  .min(3, "O usuário deve ter pelo menos 3 caracteres.")
  .max(80, "O usuário deve ter no máximo 80 caracteres.")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Use apenas letras, números, ponto, hífen ou sublinhado.",
  )
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128, "A senha deve ter no máximo 128 caracteres.");

export const createUsuarioSchema = z
  .object({ username: usernameSchema })
  .strict();

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Informe a senha.").max(128),
});

export const changePasswordBase = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual.").max(128),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Confirme a nova senha.").max(128),
});

export const changePasswordSchema = changePasswordBase
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "A nova senha deve ser diferente da atual.",
    path: ["newPassword"],
  });

export const usuarioIdSchema = z.string().uuid("Usuário inválido.");

export type CreateUsuarioInput = z.input<typeof createUsuarioSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
