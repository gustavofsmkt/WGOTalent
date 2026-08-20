import { describe, expect, it } from "vitest";
import {
  calcularDadosPendentes,
  extracaoCurriculoOutputSchema,
} from "./extracao-curriculo";

const base = {
  nome: "Maria Silva",
  email: "maria@example.com",
  celular: "62999999999",
  uf: "GO",
  cidade: "Goiânia",
  resumoProfissional: "Desenvolvedora com 5 anos de experiência.",
  formacoes: [],
  experiencias: [],
  certificacoes: [],
};

describe("extracaoCurriculoOutputSchema", () => {
  it("accepts dataNascimento/cep/bairro/logradouro as null", () => {
    const result = extracaoCurriculoOutputSchema.safeParse({
      ...base,
      dataNascimento: null,
      cep: null,
      bairro: null,
      logradouro: null,
    });
    expect(result.success).toBe(true);
  });

  it("still requires cidade/uf", () => {
    const { cidade: _cidade, ...withoutCidade } = base;
    const result = extracaoCurriculoOutputSchema.safeParse({
      ...withoutCidade,
      dataNascimento: null,
      cep: null,
      bairro: null,
      logradouro: null,
    });
    expect(result.success).toBe(false);
  });

  it("accepts email as null when the résumé has none", () => {
    const result = extracaoCurriculoOutputSchema.safeParse({
      ...base,
      email: null,
      dataNascimento: null,
      cep: null,
      bairro: null,
      logradouro: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a missing key (undefined), not just an explicit null, for the nullish fields", () => {
    // Reprodução de um caso real: o Gemini às vezes omite a chave em vez de
    // mandar null quando o campo não é obrigatório no JSON Schema.
    const result = extracaoCurriculoOutputSchema.safeParse({
      ...base,
      email: undefined,
      dataNascimento: undefined,
      cep: undefined,
    });
    expect(result.success).toBe(true);
  });
});

describe("calcularDadosPendentes", () => {
  it("returns null when nothing is missing", () => {
    expect(
      calcularDadosPendentes({
        dataNascimento: "1990-01-01",
        cep: "74000-000",
        bairro: "Centro",
        logradouro: "Rua A",
        email: "maria@example.com",
      }),
    ).toBeNull();
  });

  it("lists missing fields in Portuguese", () => {
    expect(
      calcularDadosPendentes({
        dataNascimento: null,
        cep: null,
        bairro: "Centro",
        logradouro: "Rua A",
        email: "maria@example.com",
      }),
    ).toBe("Data de nascimento, CEP");
  });

  it("flags a missing email as pending too", () => {
    expect(
      calcularDadosPendentes({
        dataNascimento: "1990-01-01",
        cep: "74000-000",
        bairro: "Centro",
        logradouro: "Rua A",
        email: null,
      }),
    ).toBe("E-mail");
  });
});
