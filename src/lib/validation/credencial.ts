import { z } from "zod";
import { nonEmptyString } from "./common";

export const credencialCreateSchema = z.object({
  nome: nonEmptyString("O nome é obrigatório").max(120),
  provider: nonEmptyString("O provedor é obrigatório").max(60),
  apiKey: nonEmptyString("A API key é obrigatória"),
});

export type CredencialCreateInput = z.input<typeof credencialCreateSchema>;
export type CredencialCreateOutput = z.output<typeof credencialCreateSchema>;
