/**
 * Reduz o celular à forma canônica usada como chave de deduplicação: apenas
 * dígitos, no padrão nacional DDD + número (11 dígitos para o móvel com o 9º
 * dígito). Remove o DDI do Brasil ("55") somente quando o resultado seriam os
 * 11 dígitos nacionais — um número de 11 dígitos que já começa com "55" tem
 * "55" como DDD (Rio Grande do Sul), não como código de país, e é preservado.
 * Retorna `null` quando não sobra nenhum dígito.
 */
export function normalizarCelular(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  return digits === "" ? null : digits;
}

/**
 * Formata um celular para exibição no padrão (XX) XXXXX-XXXX. Aceita valores já
 * canônicos ou ainda com pontuação/DDI (normaliza antes). Cai para o padrão de
 * 10 dígitos (XX) XXXX-XXXX e, fora desses tamanhos, devolve o texto original —
 * exibir um dado legado fora do padrão é melhor que escondê-lo.
 */
export function formatarCelular(value: string | null | undefined): string {
  const digits = normalizarCelular(value);
  if (!digits) return "";
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value ?? "";
}

/**
 * Máscara progressiva para o campo de celular do formulário: formata conforme o
 * usuário digita, limitando a 11 dígitos (DDD + 9) e descartando o DDI colado.
 * O valor final ("(11) 98765-4321") ainda é reduzido à forma canônica pelo Zod
 * no submit (ver `celularSchema` em ~/lib/validation/candidato).
 */
export function mascaraCelular(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
