import { describe, expect, it } from "vitest";
import {
  cadastroBancoTalentosEstaVencido,
  calcularLimiteBancoTalentos,
} from "./permanencia-banco-talentos";

describe("permanência no banco de talentos", () => {
  it("subtracts three calendar months in UTC and clamps to the destination month", () => {
    const limite = calcularLimiteBancoTalentos(
      new Date("2026-05-31T14:30:00.000Z"),
    );

    expect(limite.toISOString()).toBe("2026-02-28T14:30:00.000Z");
  });

  it("keeps the exact three-month boundary eligible", () => {
    const limite = new Date("2026-06-11T12:00:00.000Z");

    expect(
      cadastroBancoTalentosEstaVencido("2026-06-11T12:00:00.000Z", limite),
    ).toBe(false);
    expect(
      cadastroBancoTalentosEstaVencido("2026-06-11T11:59:59.999Z", limite),
    ).toBe(true);
  });
});
