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

  it("still requires cidade/uf/email", () => {
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
});

describe("calcularDadosPendentes", () => {
  it("returns null when nothing is missing", () => {
    expect(
      calcularDadosPendentes({
        dataNascimento: "1990-01-01",
        cep: "74000-000",
        bairro: "Centro",
        logradouro: "Rua A",
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
      }),
    ).toBe("Data de nascimento, CEP");
  });
});
