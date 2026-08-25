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

  it("falls back to the default when nacionalidade/estadoCivil arrive as explicit null", () => {
    // O JSON Schema mandado ao agente exige essas chaves (modo strict, ver
    // extracao-curriculo.ts), então um provedor pode mandar null em vez de
    // simplesmente omitir a chave — o fallback precisa valer nos dois casos.
    const result = extracaoCurriculoOutputSchema.safeParse({
      ...base,
      nacionalidade: null,
      estadoCivil: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nacionalidade).toBe("brasileira");
      expect(result.data.estadoCivil).toBe("nao_informado");
    }
  });

  it("falls back to false when the boolean flags arrive as explicit null", () => {
    const result = extracaoCurriculoOutputSchema.safeParse({
      ...base,
      possuiVeiculo: null,
      ensinoMedioConcluido: null,
      disponivelViagens: null,
      disponivelMudanca: null,
      inicioImediato: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.possuiVeiculo).toBe(false);
      expect(result.data.ensinoMedioConcluido).toBe(false);
      expect(result.data.disponivelViagens).toBe(false);
      expect(result.data.disponivelMudanca).toBe(false);
      expect(result.data.inicioImediato).toBe(false);
    }
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
        celular: "62999999999",
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
        celular: "62999999999",
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
        celular: "62999999999",
      }),
    ).toBe("E-mail");
  });

  it("flags a missing celular as pending too", () => {
    expect(
      calcularDadosPendentes({
        dataNascimento: "1990-01-01",
        cep: "74000-000",
        bairro: "Centro",
        logradouro: "Rua A",
        email: "maria@example.com",
        celular: null,
      }),
    ).toBe("Celular");
  });
});
