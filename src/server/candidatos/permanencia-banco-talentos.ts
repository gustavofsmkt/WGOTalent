export const MESES_PERMANENCIA_BANCO_TALENTOS = 3;

/**
 * Calcula três meses-calendário para trás em UTC. Quando o dia não existe no
 * mês de destino (por exemplo, 31 de maio -> fevereiro), usa o último dia
 * daquele mês e preserva o horário do instante de referência.
 */
export function calcularLimiteBancoTalentos(agora = new Date()): Date {
  const limite = new Date(agora);
  const dia = limite.getUTCDate();

  limite.setUTCDate(1);
  limite.setUTCMonth(limite.getUTCMonth() - MESES_PERMANENCIA_BANCO_TALENTOS);

  const ultimoDiaDoMes = new Date(
    Date.UTC(limite.getUTCFullYear(), limite.getUTCMonth() + 1, 0),
  ).getUTCDate();
  limite.setUTCDate(Math.min(dia, ultimoDiaDoMes));

  return limite;
}

/** O instante exatamente igual ao limite ainda está dentro dos três meses. */
export function cadastroBancoTalentosEstaVencido(
  updatedAt: string,
  limite: Date,
): boolean {
  return new Date(updatedAt).getTime() < limite.getTime();
}
