import { describe, it, expect } from "vitest";
import { normalizarCelular, formatarCelular, mascaraCelular } from "./celular";

describe("normalizarCelular", () => {
  it("reduz formatos variados à forma canônica (DDD + 9)", () => {
    expect(normalizarCelular("(11) 98765-4321")).toBe("11987654321");
    expect(normalizarCelular("11 98765 4321")).toBe("11987654321");
    expect(normalizarCelular("11987654321")).toBe("11987654321");
  });

  it("remove o DDI (+55) quando sobram os 11 dígitos nacionais", () => {
    expect(normalizarCelular("+55 (11) 98765-4321")).toBe("11987654321");
    expect(normalizarCelular("5511987654321")).toBe("11987654321");
  });

  it("preserva '55' quando é o DDD (Rio Grande do Sul), não o DDI", () => {
    // (55) 98765-4321 -> 11 dígitos começando com 55: DDD, não país.
    expect(normalizarCelular("55987654321")).toBe("55987654321");
  });

  it("retorna null para vazio, nulo ou sem dígitos", () => {
    expect(normalizarCelular("")).toBeNull();
    expect(normalizarCelular(null)).toBeNull();
    expect(normalizarCelular(undefined)).toBeNull();
    expect(normalizarCelular("sem número")).toBeNull();
  });
});

describe("formatarCelular", () => {
  it("formata 11 dígitos como (XX) XXXXX-XXXX", () => {
    expect(formatarCelular("11987654321")).toBe("(11) 98765-4321");
    expect(formatarCelular("+55 11 98765 4321")).toBe("(11) 98765-4321");
  });

  it("formata 10 dígitos como (XX) XXXX-XXXX", () => {
    expect(formatarCelular("1133334444")).toBe("(11) 3333-4444");
  });

  it("devolve string vazia para valores vazios/nulos", () => {
    expect(formatarCelular(null)).toBe("");
    expect(formatarCelular("")).toBe("");
  });
});

describe("mascaraCelular", () => {
  it("formata progressivamente conforme a digitação", () => {
    expect(mascaraCelular("")).toBe("");
    expect(mascaraCelular("11")).toBe("(11");
    expect(mascaraCelular("119")).toBe("(11) 9");
    expect(mascaraCelular("11987")).toBe("(11) 987");
    expect(mascaraCelular("1198765")).toBe("(11) 98765");
    expect(mascaraCelular("11987654321")).toBe("(11) 98765-4321");
  });

  it("limita a 11 dígitos e descarta o DDI colado", () => {
    expect(mascaraCelular("119876543210000")).toBe("(11) 98765-4321");
    expect(mascaraCelular("5511987654321")).toBe("(11) 98765-4321");
  });
});
