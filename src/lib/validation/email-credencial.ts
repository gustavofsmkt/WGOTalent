import { z } from "zod";
import { nonEmptyString, dateStringSchema } from "./common";

export const emailCredencialCreateSchema = z.object({
  host: nonEmptyString("O host é obrigatório").max(255),
  porta: z.coerce.number().int().positive().max(65535, "Porta inválida"),
  usuario: nonEmptyString("O usuário é obrigatório").max(254),
  senha: nonEmptyString("A senha é obrigatória"),
  pasta: nonEmptyString("A pasta é obrigatória").max(120).default("INBOX"),
  // Quando preenchida, a primeira captura varre a caixa desde o início,
  // mas o próprio IMAP SEARCH já filtra por SINCE <data> — nunca busca
  // nem processa mensagem anterior a ela. Uso único para backfill antes de
  // colocar a captação em produção contra uma caixa que já recebe
  // currículos há tempo. Vazio (padrão): pula para "a partir de agora",
  // sem varrer nada — o certo para uma caixa nova (ex: teste pessoal).
  capturarDesde: z
    .union([dateStringSchema, z.literal("")])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : val)),
});

export type EmailCredencialCreateInput = z.input<typeof emailCredencialCreateSchema>;
export type EmailCredencialCreateOutput = z.output<typeof emailCredencialCreateSchema>;
