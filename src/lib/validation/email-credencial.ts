import { z } from "zod";
import { nonEmptyString } from "./common";

export const emailCredencialCreateSchema = z.object({
  host: nonEmptyString("O host é obrigatório").max(255),
  porta: z.coerce.number().int().positive().max(65535, "Porta inválida"),
  usuario: nonEmptyString("O usuário é obrigatório").max(254),
  senha: nonEmptyString("A senha é obrigatória"),
  pasta: nonEmptyString("A pasta é obrigatória").max(120).default("INBOX"),
});

export type EmailCredencialCreateInput = z.input<typeof emailCredencialCreateSchema>;
export type EmailCredencialCreateOutput = z.output<typeof emailCredencialCreateSchema>;
